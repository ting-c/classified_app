const { Sequelize } = require('sequelize');

module.exports = new Sequelize('classified_app', 'postgres', null, {
  host: 'localhost',
  dialect: 'postgres'
});