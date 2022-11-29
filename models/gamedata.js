const mongoose = require('mongoose');

const gameDataSchema = mongoose.Schema({
  state: {type: String},
  text: {type: String},
  buttons: {type: Array},
  goto: {type: Array}
});

module.exports = mongoose.model('gameData', gameDataSchema);