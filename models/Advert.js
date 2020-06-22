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
  postcode: {
    type: Sequelize.STRING
  },
  contact_email: {
    type: Sequelize.STRING
  }
});

module.exports = Advert;