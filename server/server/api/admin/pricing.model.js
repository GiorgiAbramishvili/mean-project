'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var PricingOfferSchema = new Schema({
    type: String,
    price: Number,
    name: String,
    description: String,
    from: Date,
    to: Date
})

var CouponSchema = new Schema({
    type: String,
    amount_off: Number,
    percent_off: Number,
    code: String,
    redemptions: Number,
    from: Date,
    to: Date
})

module.exports = {
    PricingOffer: mongoose.model('PricingOffer', PricingOfferSchema),
    Coupon: mongoose.model('Coupon', CouponSchema)
}