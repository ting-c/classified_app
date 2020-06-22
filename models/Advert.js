const { Sequelize } = require('sequelize');
const db = require('../config/db');

const Advert = db.define('advert', {
  title: {
    type: Sequelize.STRING
  },
  description: {
    type: Sequelize.STRING
  },
  categories: {
    type: Sequelize.STRING
  },
  price: {
    type: Sequelize.STRING
  },
  contact_email: {
    type: Sequelize.STRING
  },
  postcode: {
    type: Sequelize.STRING
  },
  longitude: {
    type: Sequelize.FLOAT
  },
  latitude: {
    type: Sequelize.FLOAT
  },
  location: {
    type: Sequelize.STRING
  }
});

module.exports = Advert;