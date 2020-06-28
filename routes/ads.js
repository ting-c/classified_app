const express = require('express');
const router = express.Router();
const Advert = require('../models/Advert');
const { Op } = require('sequelize');
const { 
	addDistanceForAds, 
	checkAuthenticated, 
	postAdWithCustomPostcode, 
	postAdWithRegisterPostcode, 
	sortByPrice, 
	sortAdsByDistance,
	updateAdvert,
	deleteAdvert 
} = require('../utils');

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
	const { term, min_price, max_price, min_distance, max_distance, sort_by } = req.query;

	// check if user is login when distance sort is used
	if (!req.user && (sort_by === 'distance_desc' || sort_by === 'distance_asc')) {
		res.render('ads', { errorMessage: 'Please login before using distance sort'})
		return
	}

	try {
		const ads = await Advert.findAll({
			raw: true,
			where: {
				[Op.or]: {
					title: {
						[Op.iLike]: `%${term}%`,
					},
					description: {
						[Op.iLike]: `%${term}%`,
					},
				},
				price: {
					[Op.between]: [min_price || 0, max_price || 100000],
				},
			},
			order: sortByPrice(sort_by),
		});

		if ( !req.user && (min_distance || max_distance) ) {
			res.render('index', {
				layout: 'landing', 
				errorMessage: 'Login required before using the distance filter',
				...req.query
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

			// render ads view with sort
			if ((sort_by === 'distance_desc') || (sort_by === 'distance_asc')) {
				const adsSortedByDistance = sortAdsByDistance(sort_by, adswithDistanceFilter);	
				res.render('ads', { ads: adsSortedByDistance, term });
				return;
			};

			// render ads view without sort 
			res.render('ads', { ads: adswithDistanceFilter, term });
			return 

		}; 

		// render ads view without sort / filter
		res.render("ads", { ads, term });

	} catch (err) {
		console.log(err);
		res.render('ads', { term, errorMessage: 'Failed to connect to database' });
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
		updateAdvert(req, res, ad, fieldsToUpdate);
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

		deleteAdvert(res, ad);	
	} catch {
		res.render("edit_ads", { errorMessage: "Failed to connect to database" });
		return; 
	}
})

module.exports = router;