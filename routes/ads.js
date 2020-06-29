const express = require('express');
const router = express.Router();
const Advert = require('../models/Advert');
const {
	addDistanceForAds,
	checkAuthenticated,
	postAdWithCustomPostcode,
	postAdWithRegisterPostcode,
	sortAdsByDistance,
	updateAdvertIsSuccessful,
	getAdsFromDbWithPriceParams,
	getLocationDetails,
	addAdsImgUrl
} = require("../utils");

router.get('/', (req, res) => 
  Advert.findAll({ raw:true })
    .then(ads => {
			if (req.user) {
				const userLocation = {
					lat: req.user.latitude,
					lng: req.user.longitude
				}
				res.render('ads', { ads: addDistanceForAds(ads, userLocation) });
			} else {
				res.render("ads", { ads });
			}
			
    })
    .catch(err => console.log(err)));

router.get('/post', checkAuthenticated, (req, res) => res.render('post'));

// Post
router.post("/post", checkAuthenticated, async (req, res) => {

	// Server side validation
	const fieldsToCheck = [
		"title",
		"description",
		"categories",
		"price"
	];
	let errorLog = "";

	// check if field is empty
	fieldsToCheck.forEach((field) => {
		if (!req.body[field]) {
			errorLog += field + ", ";
		}
	});

	const errorMessage =
		`Please add the following information: ` + errorLog.slice(0, -2);
		
	if (!!errorLog) {
		res.render("post", { errorMessage, ...req.body });
		return;
	}

	const { user, body } = req;
	const { postcode_type, custom_postcode } = req.body

	let isSuccessful;
	if (postcode_type === "register") {
		isSuccessful = postAdWithRegisterPostcode(user, body);
	} else {
		const response = await getLocationDetails(custom_postcode);
		if (!response) { 
			res.render('post', { 
				errorMessage: 'Invalid Postcode', 
				...req.body
			});
			return
		}
		isSuccessful = postAdWithCustomPostcode(user, body, response);
	}

	if (isSuccessful) {
		res.redirect("/ads/myads");
	} else {
		res.render("post", {
			errorMessage: "Failed to post advert",
			...req.body,
		});
	}

});

// Search
router.get('/search', async (req, res) => {
	const { term, min_price, max_price, min_distance, max_distance, sort_by } = req.query;

	// check if user is login when distance sort is used
	if (!req.user && (sort_by === 'distance_desc' || sort_by === 'distance_asc')) {
		res.render('ads', { errorMessage: 'Please login before using distance sort'})
		return
	}

	let ads;
	try {
		ads = await getAdsFromDbWithPriceParams(term, min_price, max_price, sort_by);
	} catch (err) {
		console.log(err)
		res.render("ads", { term, errorMessage: "Failed to connect to database" });
		return 
	};

	// render ads view without distance sort / filter
	if (!req.user) {
		// check if distance filter is selected when user is not logged in
		if (min_distance || max_distance) {
			res.render("index", {
				layout: "landing",
				errorMessage: "Login required before using the distance filter",
				...req.query,
			});
			return; 
		};
		const adsWithImgUrl = await addAdsImgUrl(ads);
		res.render("ads", { ads: adsWithImgUrl, term });
		return 		
	};

	// User is logged in, add distance to ads
	if (req.user) {
		const userLocation = {
			lat: req.user.latitude,
			lng: req.user.longitude,
		};
		const adsWithDistanceFilter = addDistanceForAds(ads, userLocation).filter(
			(ad) =>
				(ad.distance > (min_distance || 0) ) && 
				(ad.distance < (max_distance || 1500) )
		);

		// render ads view with distance sort when selected
		if ((sort_by === 'distance_desc') || (sort_by === 'distance_asc')) {
			const adsSortedByDistance = sortAdsByDistance(sort_by, adswithDistanceFilter);
			const adsWithImgUrl = await addAdsImgUrl(adsSortedByDistance);
			res.render('ads', { ads: adsWithImgUrl, term });
			return;
		};

		// render ads view without sort 
		const adsWithImgUrl = await addAdsImgUrl(adsWithDistanceFilter);
		res.render('ads', { ads: adsWithImgUrl, term });
		return
	}; 
})

router.get('/myads', checkAuthenticated, async (req, res) => {
	let ads;
	try {
		ads = await Advert.findAll({
			raw: true,
			where: {
				seller_id: req.user.id
			},
			order: [
				['updatedAt', 'DESC'],
				['createdAt', 'DESC']
			]
		}); 
	} catch (err) {
		res.render('myads', { errorMessage: 'Failed to connect to database'});
	}
	res.render('myads', {	ads	});
})

router.post('/edit', checkAuthenticated, async (req, res) => {
	const { id } = req.body;
	
	try {
		const ad = await Advert.findByPk(id, { raw: true });

		// check if user is the owner of the advert
		if (ad.seller_id !== req.user.id) { 
			res.render('myads', { errorMessage: 'Unauthorized Access'});
			return 
		};
		res.render('edit_ads', { ...ad });
	} catch (err) {
		console.log(err);
	}

})

router.post('/save', checkAuthenticated, async (req, res) => {

	// find advert by id (primary key)
	let ad;
	try {
		ad = await Advert.findByPk(req.body.id);
	} catch (err) {
		res.render('edit_ads', { errorMessage: 'Failed to connect to database'});
	}
	
	// display error message if advert doesn't exist in db
	if (!ad) { res.render('edit_ads', { errorMessage: 'Advert not found'}); return };

	// check if user is the owner of the advert
	if (ad.dataValues.seller_id !== req.user.id) { 
		res.render('index', { errorMessage: 'Unauthorized Access'});
		return
	};

	// update fields except id 
	const { id, ...fieldsToUpdate } = req.body
	
	if (updateAdvertIsSuccessful(ad, fieldsToUpdate)) {
		res.render("edit_ads", {
			successMessage: "Changes saved successfully",
			...req.body,
		});
	} else {
		res.render("edit_ads", {
			errorMessage: "Failed to save changes",
			...req.body,
		});
	};

})

router.post('/delete', checkAuthenticated, async (req, res) => {

	// find advert by id (primary key)
	let ad;
	try {
		ad = await Advert.findByPk(req.body.id);
	} catch (err) {
		res.render("edit_ads", { errorMessage: "Failed to connect to database" });
		return; 
	};
	
	// display error message if advert doesn't exist in db
	if (!ad) { res.render('edit_ads', { errorMessage: 'Advert not found'}); return };	
	
	// check if user is the owner of the advert
	if (ad.dataValues.seller_id !== req.user.id) { 
		res.render('index', { errorMessage: 'Unauthorized Access'});
	};

	// delete ad
	try {
		ad.destroy();
		res.redirect("/ads/myads");
	} catch (err) {
		res.render("edit_ads", { errorMessage: "Failed to delete" });
		return 
	}
	
})

module.exports = router;