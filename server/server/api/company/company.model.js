'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var CompanySchema = new Schema({
  SIRET: String,
  SIREN: String,
  RAISON_SOC: String,
  NOM: String,
  DATE_CREA: String,
  ENSEIGNE: String,
  ADRESSE: String,
  CP: Number,
  VILLE: String,
  APE: String,
  NAF: String,
  COOR: [{
    LAT: Number,
    LNG: Number
  }],
  DATE_UPLOAD: Date,
  RECLAIMED: String,
  TAGS: [String],
});

module.exports = mongoose.model('Company', CompanySchema);
