const { Sequelize } = require("sequelize");
const db = require("../config/db");

const User = db.define("user", {
	name: {
		type: Sequelize.STRING,
	},
	email: {
		type: Sequelize.STRING,
	},
	password: {
		type: Sequelize.STRING,
	},
	postcode: {
		type: Sequelize.STRING,
	},
	longitude: {
		type: Sequelize.FLOAT,
	},
	latitude: {
		type: Sequelize.FLOAT,
	},
	location: {
		type: Sequelize.STRING,
	}
});

module.exports = User;
