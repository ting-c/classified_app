const { Sequelize } = require("sequelize");
const db = require("../config/db");
const User = require('./User');
const Advert = require("./Advert");

const Message = db.define("message", {
	sender_id: {
		type: Sequelize.INTEGER,
		references: {
			model: User,
			key: "id"
		}
	},
	recipient_id: {
		type: Sequelize.INTEGER,
		references: {
			model: User,
			key: "id"
		}
	},
	advert_id: {
		type: Sequelize.STRING,
		references:{
			model: Advert,
			key: "id"
		}
	},
	content: {
		type: Sequelize.STRING,
	},
	is_read: {
		type: Sequelize.BOOLEAN
	}
});

module.exports = Message;
