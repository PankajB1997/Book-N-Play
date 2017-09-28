var express = require('express');
var router = express.Router();

// Get Homepage
router.get('/', ensureAuthenticated, function(req, res) {
	res.render('index');
});

function ensureAuthenticated(req, res, next) {
	if(req.isAuthenticated()){
		return next();
	} else {
		req.flash('error_msg','You are not logged in.');
		res.redirect('/users/login');
	}
}

// Don't allow user to access login/register page if already logged in
router.get('/users/login', ensureNotAuthenticated, function(req, res) {
	res.render('login');
});

router.get('/users/register', ensureNotAuthenticated, function(req, res) {
	res.render('register');
});

router.get('/users/forgotPassword', ensureNotAuthenticated, function(req, res) {
	res.render('forgotPassword');
});

function ensureNotAuthenticated(req, res, next) {
	if (req.isAuthenticated()) {
		req.flash('error_msg', 'You are already logged in.');
		res.redirect('/');
	}	else {
		return next();
	}
}

module.exports = router;
