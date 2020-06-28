const express = require("express");
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require("../models/User");
const axios = require('axios');

const checkNotAuthenticated = (req, res, next) => {
	if (!req.isAuthenticated()) {
		return next();
	}

	res.redirect("/");
};

// Register
router.get("/", checkNotAuthenticated, (req, res) => {
	res.render("register");
});

router.post("/", checkNotAuthenticated, async (req, res) => {

	// Server side validation
	const fieldsToCheck = [
		"name",
		"email",
		"password",
		"confirm_password",
		"postcode"
	];
	let errorLog = "";

	// check if field is empty
	fieldsToCheck.forEach((field) => {
		if (!req.body[field]) {
			errorLog += field + ", ";
		}
	});

	// check if passwords are identical
	if (req.body.password !== req.body.confirm_password) {
		res.render("register", { errorMessage: 'Please enter the same passwords' });
		return
	}

	const errorMessage =
		`Please add the following information: ` + errorLog.slice(0, -2);

	if (!!errorLog) {
		res.render("post", {
			errorMessage,
			name,
			email,
			postcode
		});
		return;
	}

	// check if postcode is valid
	const { name, email, password } = req.body;
	try {
		const response = await axios.get(`https://api.postcodes.io/postcodes/${req.body.postcode}`);
		console.log('response: ', response);
		const { status } = response;
		const {
			postcode,
			longitude,
			latitude,
			admin_ward,
			admin_county,
			region,
		} = response.data.result;

		if (status === 200) {
			
			const hashedPassword = await bcrypt.hash(password, 10);
			try {
				await User.create({
					name,
					email,
					password: hashedPassword,
					postcode,
					longitude,
					latitude,
					location: `${admin_ward},${
						admin_county ? ` ${admin_county},` : ""
					} ${region}`,
				});
				res.redirect('/login');
			} catch (err) {
				res.render('register', { 
					errorMessage: 'Failed to register',
					name,
					email,
					postcode
				});
			}
		}		
	} catch (err) {
		res.render("register", {
			errorMessage: "Invalid postcode",
			name,
			email
		});
	}

});

module.exports = router;
