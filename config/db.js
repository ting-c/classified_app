const { Sequelize } = require('sequelize');

module.exports = new Sequelize(process.env.DATABASE_URL, 'postgres', null, {
  dialect: 'postgres',
});