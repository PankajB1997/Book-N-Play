const express = require('express');
const router = express.Router();
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const User = require('../models/user');

// Register
router.get('/register', function(req, res) {
	res.render('register');
});

// Login
router.get('/login', function(req, res) {
	res.render('login');
});

// Forgot Password
router.get('/forgotPassword', function(req, res) {
	res.render('forgotPassword');
});

// Register
router.post('/register', function(req, res) {
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
	let newUser;

	if (errors) {
		res.render('register', {
			errors: errors,
		});
	} else {
		newUser = new User({
			name: name,
			email: email,
			username: username,
			password: password,
		});
	}

	User.createUser(newUser, function(error, user) {
		if (error) throw error;
		console.log(user);
	});

	req.flash('success_msg', 'You are successfully registered! You may login now.');

	res.redirect('/users/login');
});

passport.use(new LocalStrategy(
  function(usernameOrEmail, password, done) {
    User.getUserByUsername(usernameOrEmail, function (error, user) {
			if (error) throw error;
			if (user != null) {
				User.comparePassword(password, user.password, function (error, isMatch) {
					if (error) throw error;
					if (isMatch) {
						return done(null, user);
					} else {
						return done(null, false, {message: 'The password is invalid.'});
					}
				});
			}
			else {
				User.getUserByEmail(usernameOrEmail, function (error, userByEmail) {
					if (error) throw error;
					if (!userByEmail) {
						return done(null, false, {message: 'An account with this username or email does not exist.'});
					}
					User.comparePassword(password, userByEmail.password, function (error, isMatch) {
						if (error) throw error;
						if (isMatch) {
							return done(null, userByEmail);
						} else {
							return done(null, false, {message: 'The password is invalid.'});
						}
					});
				});
			}
		});
  }
));

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.getUserById(id, function(err, user) {
    done(err, user);
  });
});

router.post('/login',
  passport.authenticate('local', { successRedirect: '/', failureRedirect: '/users/login', failureFlash: true }),
  function(req, res) {
		res.redirect('/');
  });

router.get('/logout', function(req, res) {
	req.logout();
	req.flash('success_msg', 'You have been logged out.');
	res.redirect('/users/login');
});

router.post('/forgotPassword', function(req, res) {
	let usernameOrEmail = req.body.usernameOrEmail;
	req.checkBody('usernameOrEmail', 'Username/Email is required').notEmpty();
	let errors = req.validationErrors();
	if (errors) {
		res.render('forgotPassword', {
			errors: errors,
		});
	}
	else {
		User.getUserByUsername(usernameOrEmail, function (error, user) {
			if (error) throw error;
			if (user != null) {

			}
			else {
				User.getUserByEmail(usernameOrEmail, function (error, userByEmail) {
					if (error) throw error;
					if (!userByEmail) {
						req.flash('error_msg', 'An account with this username or email does not exist.');
						res.redirect('/users/forgotPassword');
					}

				});
			}
		});
	}
});

module.exports = router;
