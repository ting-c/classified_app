const express = require('express');
const router = express.Router();
const { multerUploads } = require('../config/multer');
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
	addAdsImgUrl,
	addImgUrlInDb,
	getImgUrlFromStorage,
	getAdInfo
} = require("../utils");

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

	let advert_id;
	if (postcode_type === "register") {
		advert_id = await postAdWithRegisterPostcode(user, body);
	} else {
		const response = await getLocationDetails(custom_postcode);
		if (!response) { 
			res.render('post', { 
				errorMessage: 'Invalid Postcode', 
				...req.body
			});
			return
		}
		advert_id = await postAdWithCustomPostcode(user, body, response);
	}

	if (advert_id) {
		// successfully added advert in db
		res.render('upload', { advert_id, title: req.body.title });
	} else {
		res.render("post", {
			errorMessage: "Failed to post advert",
			...req.body,
		});
	};
});

router.post("/upload", checkAuthenticated, multerUploads, async (req, res) => {

	const { advert_id, title } = req.body;
	if (!req.files) {
		res.render("upload", { errorMessage: "Image(s) not found", advert_id, title });
		return
	};
	
	// store images and get image urls
	let urls;
	try {
		urls = await Promise.all(req.files.map( async image => 
			await getImgUrlFromStorage(image.buffer)
		))	
	} catch (err) {
			res.render("upload", {
			errorMessage: "Failed to connect to image storage",
		});
		return;
	}

	// store image urls in db
	const addImgUrlisSuccessful = addImgUrlInDb(advert_id, urls);
	return addImgUrlisSuccessful
		? res.render("myads", { successMessage: 'Image uploaded successfully'})
		: res.render("upload", {
				errorMessage: "Failed to save uploaded image"
			});
});

// Search
router.get('/search', async (req, res) => {
	const { term, min_price, max_price, min_distance, max_distance, sort_by } = req.query;

	let ads;
	try {
		ads = await getAdsFromDbWithPriceParams(term, min_price, max_price, sort_by);
	} catch (err) {
		res.render("ads", { term, errorMessage: "Failed to connect to database" });
		return 
	};

	const adsWithImgUrl = await addAdsImgUrl(ads);

	// render ads view without distance sort / filter
	if (!req.user) { 
		res.render('ads', { ads: adsWithImgUrl, term } );
		return
	};

	// User is logged in, add distance to ads
	const userLocation = {
		lat: req.user.latitude,
		lng: req.user.longitude,
	};
	const adsWithDistanceFilter = addDistanceForAds(adsWithImgUrl, userLocation).filter(
		(ad) =>
			( (ad.distance >= (min_distance || 0)) &&  (ad.distance <= (max_distance || 1500)) ) 
	);

	if (!sort_by) {
		res.render('ads', { ads: adsWithDistanceFilter, term });
		return
	}

	// render ads view with distance sort
	const adsSortedByDistance = sortAdsByDistance(sort_by, adsWithDistanceFilter);
	res.render('ads', { ads: adsSortedByDistance, term });
	return;
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
	};

	const adsWithImgUrl = await addAdsImgUrl(ads);
	res.render('myads', {	ads: adsWithImgUrl });
})

router.post('/edit', checkAuthenticated, async (req, res) => {
	const { id } = req.body;
	
	try {
		const ad = await getAdInfo(id);
		// check if user is the owner of the advert
		if (ad.seller_id !== req.user.id) { 
			res.render('myads', { errorMessage: 'Unauthorized Access'});
			return 
		};
		res.render('edit_ads', { ...ad });
	} catch (err) {
		res.render("myads", { errorMessage: "Failed to update advert" });
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
});

router.post('/info', async (req, res) => {
	const { id } = req.body;
	try {
		const ad = await getAdInfo(id);
		if (!ad) { res.render("ad_info", { errorMessage: "Failed to find advert" }) };
		res.render("ad_info", { ...ad });
	} catch (err) {
		res.render('ad_info', { errorMessage: 'Failed to connect'});
	}
})

module.exports = router;