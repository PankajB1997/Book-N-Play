const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
let uristring = process.env.MONGODB_URI || 'mongodb://localhost/booknplay';
mongoose.connect(uristring, {
  useMongoClient: true,
});
const db = mongoose.connection;

const Event = require('../models/event');

// View Upcoming Events List
router.get('/events-list', function (req, res) {
  Event.getUpcomingEventsList(function (error, eventsList) {
    console.log(eventsList);
  });
});

// Add new event
router.get('/new-event', function (req, res) {
  res.render('new-event');
});

// Add new event
router.post('/new-event', function(req, res) {
  let eventTitle = req.body.eventTitle;
	let eventType = req.body.eventType;
	let eventStartDate = req.body.eventStartDate;
	let eventEndDate = req.body.eventEndDate;
	let eventDescription = req.body.eventDescription;

  // Validation
	req.checkBody('eventTitle', 'Please give a caption for your game event.').notEmpty();
	req.checkBody('eventType', 'Please select a game!').notEmpty();
	req.checkBody('eventStartDate', 'Please select a start date for your game.').notEmpty();
	req.checkBody('eventEndDate', 'Please select an end date for your game.').notEmpty();
	req.checkBody('eventDescription', 'Please provide some description for your game event.').notEmpty();

  let errors = req.validationErrors();
	let newEvent;

  if (errors) {
		res.render('new-event', {
			errors: errors,
		});
	} else {
		newEvent = new Event({
			eventTitle: eventTitle,
      eventType: eventType,
			eventStartDate: eventStartDate,
			eventEndDate: eventEndDate,
			eventDescription: eventDescription,
		});
    Event.createEvent(newEvent, function (error, createdEvent) {
      if (error) throw error;
    });
    req.flash('success_msg', 'This game was successfully added!');
    res.redirect('/');
	}
});

module.exports = router;
