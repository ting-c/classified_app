const express = require('express');
const router = express.Router();
const Advert = require('../models/Advert');
const { Op } = require('sequelize');
const { sequelize } = require('../models/Advert');

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
  const fieldsToCheck = ['title', 'description', 'categories', 'price', 'contact_email'];
  let errorLog = '';

  fieldsToCheck.forEach(field => {
    if (!req.body[field]) { errorLog += field + ', '}
  });

  const errorMessage = `Please add the following information: ` + errorLog.slice(0, -2);

  if (!!errorLog) { 
    res.render("post", {
			errorMessage,
			...req.body
		});
  } else {
    Advert.create({ ...req.body })
      .then(res.redirect('/ads'))
      .catch(err => console.log(err))
  }

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