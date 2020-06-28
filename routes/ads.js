const express = require('express');
const router = express.Router();
const Advert = require('../models/Advert');
const { Op } = require('sequelize');
const axios = require('axios');
const getDistance = require('../getDistance');

const addDistanceForAds = (ads, userLocation) => {
  adsWithDistance = [];
  ads.forEach(ad => {
    const sellerLocation = {
      lat: ad['latitude'],
      lng: ad['longitude']
    };
    const distance = getDistance(userLocation, sellerLocation, true);
    adsWithDistance.push({ ...ad, distance }); 
  });  
  return adsWithDistance;
}

const checkAuthenticated = async (req, res, next) => {
	if (req.isAuthenticated()) {
		return next();
	}

	res.redirect("/login");
};

const postAdWithCustomPostcode = async (req, res) => {
	try {
		const response = await axios.get(`https://api.postcodes.io/postcodes/${req.body.custom_postcode}`);
		const { status } = response;
		const {
			postcode,
			longitude,
			latitude,
			admin_ward,
			admin_county,
			region,
		} = response.data.result;

		if (status === 200) {
			try {
				await Advert.create({
					...req.body,
					seller_id: req.user.id,
					seller_name: req.user.name,
					contact_email: req.user.email,
					postcode,
					longitude,
					latitude,
					location: `${admin_ward}, `||'' + `${admin_county}, `||'' + `${region}, `||''
				});
				res.redirect("/ads/myads");
			} catch (err) {
				res.render("post", {
				errorMessage: "Failed to post advert",
				...req.body,
				});
			}
		}
	} catch (err) {
		res.render("post", {
			errorMessage: "Invalid postcode",
			...req.body,
		});
	}
}

const postAdWithRegisterPostcode = async (req, res) => {
	const {
		postcode,
		longitude,
		latitude,
		location
	} = req.user;

	try {
		await Advert.create({
			...req.body,
			seller_id: req.user.id,
			seller_name: req.user.name,
			contact_email: req.user.email,
			postcode,
			longitude,
			latitude,
			location,
		});
		res.redirect('/ads/myads');
	} catch (err) {
		res.render("post", {
			errorMessage: "Failed to post advert",
			...req.body,
		});
	}
}

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
router.post("/post", checkAuthenticated, (req, res) => {

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
		res.render("post", {
			errorMessage,
			...req.body,
		});
		return;
	}

	req.body.postcode_type === 'register' ? 
		postAdWithRegisterPostcode(req, res) : postAdWithCustomPostcode(req, res);

});

// Search
router.get('/search', async (req, res) => {
	const { term, min_price, max_price, min_distance, max_distance } = req.query;
	
	try {
		const ads = await Advert.findAll({
			raw: true,
			where: { 
				[Op.or]: {
					title: { 
						[Op.iLike]: `%${term}%` 
					},
					description: { 
						[Op.iLike]: `%${term}%` 
					}
				},
				price: {
					[Op.between]: [ min_price||0 , max_price||100000 ]
				}
			}
		});

		if ( !req.user && (min_distance || max_distance) ) {
			res.render('index', {
				layout: 'landing', 
				errorMessage: 'Login required before using the distance filter',
				...req.body
			});
			return 
		}

		if (req.user) {
			const userLocation = {
				lat: req.user.latitude,
				lng: req.user.longitude,
			};
			const adswithDistanceFilter = addDistanceForAds(ads, userLocation).filter(
				(ad) =>
					(ad.distance > (min_distance || 0) ) && 
					(ad.distance < (max_distance || 1500) )
			);
			res.render('ads', { ads: adswithDistanceFilter, term });
		} else {
			res.render("ads", { ads });
		}
	} catch (err) {
		console.log(err)
	}
})

router.get('/myads', checkAuthenticated, async (req, res) => {
	try {
		const ads = await Advert.findAll({
			raw: true,
			where: {
				seller_id: req.user.id
			},
			order: [
				['updatedAt', 'DESC'],
				['createdAt', 'DESC']
			]
		}); 
		res.render('myads', {	ads	});
	} catch (err) {
		console.log(err);
	}
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

	// find advert by id
	try {
		const ad = await Advert.findByPk(req.body.id);

		// check if user is the owner of the advert
		if (ad.dataValues.seller_id !== req.user.id) { 
			res.render('index', { errorMessage: 'Unauthorized Access'})
		};

		if (!ad) { res.render('edit_ads', { errorMessage: 'Advert not found'}); return };

		// update fields except id 
		const { id, ...fieldsToUpdate } = req.body
		try {
			await ad.update({...fieldsToUpdate})
			res.render("edit_ads", { successMessage: "Changes saved successfully", ...req.body })
		} catch (err) {
			console.log(err);
			res.render("edit_ads", { errorMessage: "Failed to save changes", ...req.body });
		}
		return
	} catch (err) {
		res.render('edit_ads', { errorMessage: 'Failed to connect to database'})
		console.log(err);
	}
})

router.post('/delete', checkAuthenticated, async (req, res) => {

	// find advert by id
	try {
		const ad = await Advert.findByPk(req.body.id);
		
		// check if user is the owner of the advert
		if (ad.dataValues.seller_id !== req.user.id) { 
			res.render('index', { errorMessage: 'Unauthorized Access'})
		};

		if (!ad) { res.render('edit_ads', { errorMessage: 'Advert not found'}); return };	
		
		// delete ad
		try {
			ad.destroy();
			res.redirect("/ads/myads");
		} catch (err) {
			console.log(err);
			res.render('edit_ads', { errorMessage: 'Failed to delete'}); 
		}	
	
	} catch {
		res.render("edit_ads", { errorMessage: "Failed to connect to database" });
		return; 
	}
		
})

module.exports = router;