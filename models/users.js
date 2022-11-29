const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
  uid: {type: String},
  name: {type: String},
  stateofgame: {type: String},
});

module.exports = mongoose.model('Users', userSchema);