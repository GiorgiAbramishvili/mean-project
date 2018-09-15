'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var AutocompleteSchema = new Schema({
  name: String,
  info: String,
  active: Boolean
});

module.exports = mongoose.model('Autocomplete', AutocompleteSchema);