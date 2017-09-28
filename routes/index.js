var express = require('express');
var router = express.Router();

const Event = require('../models/event');
const User = require('../models/user');
const async = require('async');
const Handlebars = require('handlebars');

Handlebars.registerHelper("formatDate", function(date) {
	let monthNames = [
    "January", "February", "March",
    "April", "May", "June", "July",
    "August", "September", "October",
    "November", "December"
  ];
  let day = date.getDate();
  let monthIndex = date.getMonth();
  let year = date.getFullYear();
  return monthNames[monthIndex] + ' ' + day + ', ' + year;
});

// Don't allow user access to events list or add new event feature if not logged in
router.get('/', ensureAuthenticated, function(req, res) {
	res.render('index');
});

// View upcoming events list only if the user is logged in
router.get('/events/events-list', ensureAuthenticated, function (req, res) {
	Event.getUpcomingEventsList(function (error, eventsList) {
		res.render('events-list', { eventsList: eventsList });
  });
});

router.get('/events/new-event', ensureAuthenticated, function (req, res) {
	res.render('new-event');
});

function ensureAuthenticated(req, res, next) {
	if(req.isAuthenticated()){
		return next();
	} else {
		req.flash('error_msg','Please login or sign up to continue.');
		return res.redirect('/users/login');
	}
}

// Don't allow user to access login/register/forgotPassword page if already logged in
router.get('/users/login', ensureNotAuthenticated, function(req, res) {
	res.render('login');
});

router.get('/users/register', ensureNotAuthenticated, function(req, res) {
	res.render('register');
});

router.get('/users/forgotPassword', ensureNotAuthenticated, function(req, res) {
	res.render('forgotPassword');
});

router.get('/users/reset-password', ensureNotAuthenticated, function(req, res) {
	res.render('reset-password');
});

function ensureNotAuthenticated(req, res, next) {
	if (req.isAuthenticated()) {
		req.flash('error_msg', 'You are already logged in.');
		return res.redirect('/');
	}	else {
		return next();
	}
}

module.exports = router;
