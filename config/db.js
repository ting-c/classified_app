const { Sequelize } = require('sequelize');
require('dotenv').config();

module.exports = process.env.DATABASE_URL ? 
  // heroku postgres db
  new Sequelize(process.env.DATABASE_URL, {
    dialect: "postgres",
    protocol: "postgres",
    port: 5432,
    host: "ec2-3-216-129-140.compute-1.amazonaws.com",
    ssl : true,
      dialectOptions : {
        ssl: true,
      },
  }) : 
  // local db
  new Sequelize('classified_app', 'postgres', null, {
    host: 'localhost',
    dialect: 'postgres'
  });