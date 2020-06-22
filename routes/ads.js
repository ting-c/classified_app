const express = require('express');
const router = express.Router();
const Advert = require('../models/Advert');
const { Op } = require('sequelize');
const { response } = require('express');
const axios = require('axios');

router.get('/', (req, res) => 
  Advert.findAll({ raw:true })
    .then(ads => res.render('ads', { ads }))
    .catch(err => console.log(err)));

router.get('/post', (req, res) => {
  res.render('post');
});

// Post
router.post('/post', (req, res) => {
  
  // Server side validation
  const fieldsToCheck = ['title', 'description', 'categories', 'price', 'postcode','contact_email'];
  let errorLog = '';

  // check if field is empty
  fieldsToCheck.forEach(field => {
    if (!req.body[field]) { errorLog += field + ', '}
  });

  const errorMessage = `Please add the following information: ` + errorLog.slice(0, -2);

  if (!!errorLog) {
		res.render("post", {
			errorMessage,
			...req.body,
    });
    return 
	}

  // check if postcode is valid
  axios.get(`https://api.postcodes.io/postcodes/${req.body.postcode}`)
    .then( response => {
      const { status } = response;
      const { postcode, longitude, latitude, admin_ward, admin_county, region } = response.data.result;
      if (status === 200) {
        console.log('postcode is valid', response);
        Advert.create({
					...req.body,
					postcode,
					longitude,
					latitude,
					location: `${admin_ward},${admin_county ? ` ${admin_county},` : ''} ${region}`
				})
					.then(res.redirect('/ads'))
					.catch((err) => console.log(err));
      } else {
        console.log('Invalid postcode');
      }
    })
    .catch(error => console.log('Failed connection to API', error));

});

// Search
router.get('/search', (req, res) => {
  const { term } = req.query;

  Advert.findAll({
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
  })
  .then(ads => {
    res.render('ads', { ads, term });
    console.log(ads)
  })
  .catch(err => console.log(err))
})

module.exports = router;