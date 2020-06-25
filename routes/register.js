const express = require("express");
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require("../models/User");

// Register
router.get("/", (req, res) => {
	res.render("register");
});

router.post("/", async (req, res) => {
	try {
		const { name, email, password } = req.body;
		const hashedPassword = await bcrypt.hash(password, 10);
		User.create({
			name,
			email,
			password: hashedPassword
		});
		res.redirect('/login');
	} catch (err) {
		res.render('register', { 
			errorMessage: 'Failed to register'
		});
	}
});

module.exports = router;
