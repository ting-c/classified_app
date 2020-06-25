const express = require("express");
const router = express.Router();
const passport = require('passport');
const initializePassport = require('../config/passport');

initializePassport(passport);

const checkNotAuthenticated = (req, res, next) => {
	if (!req.isAuthenticated()) {
		return next()
	}

	res.redirect('/');
}

// Login
router.get("/", checkNotAuthenticated, (req, res) => {
	res.render("login");
});

router.post("/", checkNotAuthenticated,
	passport.authenticate("local", { 
		failureRedirect: "/login",
		failureFlash: true,
		successRedirect: '/' 
	}),
	function (req, res) {
		res.redirect("/");
	}
);

module.exports = router;
