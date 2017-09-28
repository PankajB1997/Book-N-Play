const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// User Schema
let UserSchema = mongoose.Schema({
	username: {
		type: String,
		index: true
	},
	password: {
		type: String
	},
	email: {
		type: String
	},
	name: {
		type: String
	},
  resetPasswordToken: String,
  resetPasswordExpires: Date,
});

let User = module.exports = mongoose.model('User', UserSchema);

module.exports.createUser = function (newUser, callback) {
  bcrypt.genSalt(10, function(err, salt) {
	    bcrypt.hash(newUser.password, salt, function(err, hash) {
	        newUser.password = hash;
	        newUser.save(callback);
	    });
	});
}

module.exports.getUserByUsername = function (username, callback) {
  let query = { username: username };
  User.findOne(query, callback);
}

module.exports.getUserByEmail = function (email, callback) {
  let query = { email: email };
  User.findOne(query, callback);
}

module.exports.getUserById = function (id, callback) {
  User.findById(id, callback);
}

module.exports.comparePassword = function (candidatePassword, hash, callback) {
  bcrypt.compare(candidatePassword, hash, function(err, isMatch) {
    	if(err) throw err;
    	callback(null, isMatch);
	});
}

module.exports.getUserByResetPasswordToken = function (resetPasswordToken, callback) {
  let query = { resetPasswordToken: resetPasswordToken, resetPasswordExpires: { $gt: Date.now() } };
  User.findOne(query, callback);
}

module.exports.updateUserPasswordByEmail = function (email, callback) {
  let query = { email: email };
  User.findOne(query, function (error, user) {
    if (error) throw error;
    bcrypt.genSalt(10, function(err, salt) {
  	    bcrypt.hash(user.password, salt, function(err, hash) {
  	        user.password = hash;
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;
  	        user.save();
            callback(null);
  	    });
  	});
  });
}
