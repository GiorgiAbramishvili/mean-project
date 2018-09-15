'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var DataResearchSchema = new Schema({
  APE: Number,
  ROME: String,
  LABEL_ROME: String,
  NAF: Number,
  LABEL_NAF: String,
  KEYWORD: String
});

module.exports = mongoose.model('DataResearch', DataResearchSchema);