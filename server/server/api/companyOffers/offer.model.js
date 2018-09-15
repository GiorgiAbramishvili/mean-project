'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var OfferSchema = new Schema({
    COMPANY: String,
    TITLE: String,
    DESCRIPTION: String,
    PRICE: Number,
    REDUCTION: Number,
    PICS: [String],
    START_DATE: Date,
    END_DATE: Date
});

module.exports = mongoose.model('Offer', OfferSchema);