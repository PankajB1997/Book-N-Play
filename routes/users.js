var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var User = require('../models/user');

// Register
router.get('/register', function(req, res){
	res.render('register');
});

// Login
router.get('/login', function(req, res){
	res.render('login');
});

// Register
router.post('/register', function(req, res){
	let name = req.body.name;
	let email = req.body.email;
	let username = req.body.username;
	let password = req.body.password;
	let confirmPassword = req.body.confirmPassword;

	// Validation
	req.checkBody('name', 'Name is required').notEmpty();
	if (email.length == 0)
		req.checkBody('email', 'Email is required').notEmpty();
	else req.checkBody('email', 'Email is not valid').isEmail();
	req.checkBody('username', 'Username is required').notEmpty();
	req.checkBody('password', 'Password is required').notEmpty();
	req.checkBody('confirmPassword', 'Passwords do not match').equals(req.body.password);

	let errors = req.validationErrors();

	if (errors) {
		res.render('register', {
			errors: errors,
		});
	} else {
		
	}
});

module.exports = router;
