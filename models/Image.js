const { Sequelize } = require("sequelize");
const db = require("../config/db");

const Image = db.define("image", {
	advert_id: {
		type: Sequelize.INTEGER
	},
	url: {
		type: Sequelize.STRING
	},
});

module.exports = Image;
