const mongoose = require('mongoose');

// Event Schema
let EventSchema = mongoose.Schema({
	eventTitle: {
		type: String,
		index: true,
	},
  eventType: {
    type: String,
  },
  eventStartDate: {
    type: Date,
  },
  eventEndDate: {
    type: Date,
  },
	eventDescription: {
		type: String,
	},
});

let Event = module.exports = mongoose.model('Event', EventSchema);

module.exports.createEvent = function (newEvent, callback) {
  newEvent.save(callback);
}

module.exports.getUpcomingEventsList = function (callback) {
  Event.find({ eventEndDate: { $gt: Date.now() } }, callback);
}
