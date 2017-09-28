const express = require('express');
const router = express.Router();
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const async = require('async');
const emailVerification = require('email-verification')(mongoose);
const crypto = require('crypto');

let uristring = process.env.MONGODB_URI || 'mongodb://localhost/booknplay';
mongoose.connect('mongodb://localhost/booknplay', {
  useMongoClient: true,
});
const db = mongoose.connection;

const User = require('../models/user');

// Email Verification Configuration
emailVerification.configure({
    verificationURL: 'http://localhost:3000/users/verify-email/${URL}',
    persistentUserModel: User,
    tempUserCollection: 'tempUser',
    transportOptions: {
        service: 'Gmail',
        auth: {
            user: 'booknplay7@gmail.com',
            pass: 'booknplay'
        }
    },
    verifyMailOptions: {
        from: '"Book-N-Play" <email.verification@booknplay.com>',
        subject: 'Let\'s confirm your email!',
        html: 'Welcome to Book-N-Play!<br><br>Click the following link to verify your account:<br><p>${URL}</p>',
        text: 'Please confirm your account by clicking the following link: ${URL}'
    }
}, function(error, options) {
  if (error) throw error;
});
emailVerification.generateTempUserModel(User, function(error, tempUserModel) {
    if (error) throw error;
});

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

	// Email verification
	let URL;
	emailVerification.createTempUser(newUser, function(error, existingPersistentUser, newTempUser) {
    if (error) throw error;
    // user already exists in persistent collection...
    if (existingPersistentUser) {
			req.flash('error_msg', 'You have already signed up and confirmed your account. Did you forget your password?');
			res.redirect('/users/login');
		}
    // a new user
    if (newTempUser) {
        URL = newTempUser[emailVerification.options.URLFieldName];
        emailVerification.sendVerificationEmail(email, URL, function(error, info) {
            if (error) throw error;
            req.flash('success_msg', 'A confirmation email is on the way! Kindly verify your email to complete your registration.');
						res.redirect('/users/login');
        });
    // user already exists in temporary collection...
    } else {
			req.flash('error_msg', 'You have already signed up. Please check your email to verify your account.');
			res.redirect('/users/login');
    }
	});
});

// user accesses the link that is sent
router.get('/verify-email/:URL', function(req, res) {
    let url = req.params.URL;
    emailVerification.confirmTempUser(url, function(err, user) {
        if (user) {
					User.createUser(user, function(error, user) {
						if (error) throw error;
					});
					req.flash('success_msg', 'You are successfully registered! You may login now.');
					res.redirect('/users/login');
        } else {
					req.flash('error_msg', 'Sorry. It seems your account has expired. Please sign up again.');
					res.redirect('/users/register');
        }
    });
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
	req.flash('success_msg', 'See ya later!');
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
		async.waterfall([
			function (done) {
				crypto.randomBytes(20, function (error, buffer) {
					if (error) throw error;
					let token = buffer.toString('hex');
					done(error, token);
				});
			},
			function (token, done) {
				User.getUserByUsername(usernameOrEmail, function (error, user) {
					if (error) throw error;
					if (user != null) {
						user.resetPasswordToken = token;
						user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
						user.save(function (error) {
							if (error) throw error;
							done(error, token, user);
						});
					}
					else {
						User.getUserByEmail(usernameOrEmail, function (error, userByEmail) {
							if (error) throw error;
							if (!userByEmail) {
								req.flash('error_msg', 'An account with this username or email does not exist.');
								res.redirect('/users/forgotPassword');
							}
							else {
								userByEmail.resetPasswordToken = token;
								userByEmail.resetPasswordExpires = Date.now() + 3600000; // 1 hour
								userByEmail.save(function (error) {
									if (error) throw error;
									done(error, token, userByEmail);
								});

							}
						});
					}
				});
			},
			function (token, user, done) {
				let smtpTransport = nodemailer.createTransport({
	        service: 'Gmail',
	        auth: {
						user: 'booknplay7@gmail.com',
            pass: 'booknplay'
	        }
	      });
	      let mailOptions = {
	        to: user.email,
	        from: '"Book-N-Play" <password-robot@booknplay.com>',
	        subject: 'Reset your password',
	        text: 'Hello ' + user.name + ',\n\n' +
						'You are receiving this email because you (or someone else) requested a password reset for your account at Book-N-Play.\n' +
	          'Please click on the following link, or paste this into your browser to complete the process:\n' +
	          'http://' + req.headers.host + '/users/reset-password/' + token + '\n\n' +
	          'If you did not request this, please ignore this email and your password will remain unchanged.\n\nRegards,\nBook-N-Play.'

	      };
	      smtpTransport.sendMail(mailOptions, function(err) {
	        req.flash('success_msg', 'An email has been sent to ' + user.email + ' with further instructions.');
	        done(err, 'done');
	      });
			}
		], function (error) {
			if (error) throw error;
			res.redirect('/users/login');
		});
	}
});

router.get('/reset-password/:token', function (req, res) {
	User.getUserByResetPasswordToken(req.params.token, function (error, user) {
		if (error) throw error;
		if (!user) {
			req.flash('error_msg', 'Your password reset request is either invalid or has expired.');
			res.redirect('/users/forgotPassword');
		} else {
			res.render('reset-password', { token: req.params.token });
		}
	});
});

router.post('/reset-password/:token', function (req, res) {
	async.waterfall([
		function (done) {
			User.getUserByResetPasswordToken(req.params.token, function (error, user) {
				if (error) throw error;
				if (!user) {
					req.flash('error_msg', 'Your password reset request is either invalid or has expired.');
					res.redirect('/users/forgotPassword');
				} else {
					if (req.body.password === req.body.confirmPassword) {
						User.updateUserPasswordByEmail(user.email, function (error) {
							if (error) throw error;
							req.logIn(user, function (error) {
								if (error) throw error;
								done(error, user);
							});
						});
					}
					else {
						req.flash('error_msg', 'The passwords do not match.');
						res.redirect('back');
					}
				}
			});
		},
		function(user, done) {
      let smtpTransport = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
					user: 'booknplay7@gmail.com',
					pass: 'booknplay'
        }
      });
      let mailOptions = {
        to: user.email,
        from: '"Book-N-Play" <password-robot@booknplay.com>',
        subject: 'Your password has been changed',
        text: 'Hello ' + user.name + ',\n\n' +
          'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n\nRegards,\nBook-N-Play.'
      };
      smtpTransport.sendMail(mailOptions, function(error) {
        req.flash('success_msg', 'Your password has been changed successfully!');
        done(error);
      });
    }
	], function (error) {
		if (error) throw error;
		res.redirect('/');
	});
});

module.exports = router;
