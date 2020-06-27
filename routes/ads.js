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

const checkAuthenticated = (req, res, next) => {
	if (req.isAuthenticated()) {
		return next();
	}

	res.redirect("/login");
};

router.get('/', (req, res) => 
  Advert.findAll({ raw:true })
    .then(ads => {
			console.log(req.user);
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
		"price",
		"postcode",
		"contact_email",
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

	// check if postcode is valid
	axios
		.get(`https://api.postcodes.io/postcodes/${req.body.postcode}`)
		.then((response) => {
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
				Advert.create({
					...req.body,
					user_id: req.user.id,
					postcode,
					longitude,
					latitude,
					location: `${admin_ward},${
						admin_county ? ` ${admin_county},` : ""
					} ${region}`,
				})
					.then(res.redirect("/ads"))
					.catch((err) => console.log(err));
			}
		})
		.catch((error) => {
			res.render("post", {
				errorMessage: "Invalid postcode",
				...req.body,
			});
		});
});

// Search
router.get('/search', async (req, res) => {
  const { term } = req.query;

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
				}
			}
		});
		res.render('ads', { ads: addDistanceForAds(ads), term });
	} catch (err) {
		console.log(err)
	}
})

router.get('/myads', checkAuthenticated, async (req, res) => {
	try {
		const ads = await Advert.findAll({
			raw: true,
			where: {
				user_id: req.user.id
			}
		}); 
		res.render('myads', {	ads	});
	} catch (err) {
		console.log(err);
	}
})
	


module.exports = router;