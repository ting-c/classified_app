const express = require('express');
const router = express.Router();
const db = require('../config/db');
const Advert = require('../models/Advert');

router.get('/', (req, res) => 
  Advert.findAll()
    .then(ads => {
      res.render('ads', { ads })
    })
    .catch(err => console.log(err)));

router.get('/post', (req, res) => {
  const data = {
    title: 'Size 5 football',
    description: 'Used condiiton',
    categories: 'sports',
    price: 2,
    contact_email: 'qwerty123@gmail.com'
  }

  let { title, description, categories, price, contact_email } = data;

  Advert.create({
    title, description, categories, price, contact_email
  })
    .then(advert => res.redirect('/ads'))
    .catch(err => console.log(err));
});

module.exports = router;