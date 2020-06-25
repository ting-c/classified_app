const express = require("express");
const router = express.Router();
const passport = require('passport');
const initializePassport = require('../config/passport');

initializePassport(passport);

// Login
router.get("/", (req, res) => {
	res.render("login");
});

router.post("/",
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
