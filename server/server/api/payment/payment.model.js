'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var PaymentSchema = new Schema({
	userId: String,
	package: String,
	recurring: Number,
	payer_id: String,
	subscr_date: Date,
	ipn_track_id: String,
	subscr_id: String,
	payer_email: String,

	status: String,
	frequency: String,
	trial: Boolean,
	trialDuration: String,
	price: String,
	lastPaid: Date,
});

module.exports = mongoose.model('Payment', PaymentSchema);