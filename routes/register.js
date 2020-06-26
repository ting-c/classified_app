const express = require("express");
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require("../models/User");

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
	try {
		const { name, email, password } = req.body;
		const hashedPassword = await bcrypt.hash(password, 10);
		User.create({
			name,
			email,
			password: hashedPassword
		});
		res.redirect('/');
	} catch (err) {
		res.render('register', { 
			errorMessage: 'Failed to register'
		});
	}
});

module.exports = router;
