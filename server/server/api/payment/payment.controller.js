'use strict';

var config = require('../../config/environment');
var Payment = require('./payment.model.js');
var Pricing = require('../admin/pricing.model');
var http = require('http');
var ipn = require('paypal-ipn');
var assert = require('assert');

var validationError = function(res, err) {
  return res.status(422).json(err);
};

/**
 * Get list of users
 * restriction: 'admin'
 */
exports.index = function(req, res) {
  ipn.verify(req.body, function(err, status) {
      console.log(req.body);
      if (status === 'VERIFIED') {
        Payment.findOne({ipn_track_id: req.body.ipn_track_id}, function(existingIPN) {
          if (existingIPN) {
            return;
          } else {
            Payment.findOne({subscr_id: req.body.subscr_id}, function(clientPayment) {
              var insert = false; 
              if (!clientPayment) {
                insert = true;
                clientPayment = new Payment(req.body);
              }
              var customfield = req.body.custom.split(':');
              clientPayment.userId = customfield[0];
              clientPayment.package = customfield[1];
              clientPayment.trial = (req.body.period1 !== undefined);
              if (clientPayment.trial) {
                clientPayment.trialDuration = req.body.period1;
              }
              if (req.body.txn_type === 'recurring_payment') {
                clientPayment.status = 'OK';
                clientPayment.lastPaid = new Date();
                clientPayment.price = req.body.mc_amount3;
                clientPayment.frequency = req.body.period3;
              } else if (req.body.txn_type === 'recurring_payment_expired') {
                clientPayment.status = 'EXPIRED';
              } else if (req.body.txn_type === 'recurring_payment_failed') {
                clientPayment.status = 'FAILED';
              } else if (req.body.txn_type === 'recurring_payment_profile_cancel') {
                clientPayment.status = 'CANCELED';
              } else if (req.body.txn_type === 'recurring_payment_suspended') {
                clientPayment.status = 'CANCELED';
              } else if (req.body.txn_type === 'subscr_cancel') {
                clientPayment.status = 'CANCELED';
              } else if (req.body.txn_type === 'subscr_failed') {
                clientPayment.status = 'FAILED';
              } else if (req.body.txn_type === 'subscr_payment' || req.body.txn_type === 'subscr_signup') {
                clientPayment.lastPaid = new Date();
                clientPayment.price = req.body.mc_amount3;
                clientPayment.frequency = req.body.period3;
                clientPayment.status = 'OK';
              }
              if (insert) {
                clientPayment.save(function(err, payment) {
                  if (err) {return res.status(500).send('An error occurred')};
                  return res.status(204).send();
                });
              } else {
                Payment.findByIdAndUpdate(clientPayment._id, {$set: clientPayment}, function(err, payment) {
                  if (err) {return res.status(500).send('An error occurred')};
                  return res.status(204).send();
                });
              }
            });
          }
        });
      } else {
        return res.status(500).send();
      }
  });
};

exports.getMyPayments = function(req, res) {
  var userId = req.user._id;
    console.log(userId);
  Payment.find({userId: userId}, function(err, payments) {
    if (err) {return res.status(500).send('An error occurred')};
    if (!payments) {
      return res.status(404).send('No payments found');
    }
    return res.status(200).json(payments);
  });
};

exports.stripeCheckout = function(req, res) {
  var now = new Date(Date.now())
  var stripe = require("stripe")("sk_test_sMEFEstSjDKxMGGclHAxxLsc")
  var offer = req.body.offer
  var token = req.body.token
  
  // 1) Checking the offer integrity (existance and price)  
  Pricing.PricingOffer.findOne({
    type: offer.type,
    from: { $lt: now },
    to: { $gt: now }
  })
  .then(function (dbOffer) {
    assert.notEqual(dbOffer, null, 'Cette offre n\'existe pas')
    assert.equal(dbOffer.price, offer.price, 'Le prix de l\'offre ne correspond pas')

    // 2) Checking the coupon intergrity (existance and value)  
    return offer.reduc
      ? Pricing.Coupon.findOne({
        code: offer.reduc.code,
        from: { $lt: now },
        to: { $gt: now }
      })
      : Promise.resolve(null)
  })
  .then(function (dbCoupon) {
    if (offer.reduc) {
      assert.notEqual(dbCoupon, null, 'Ce coupon n\'existe pas')
      assert.equal(dbCoupon.type, offer.type, 'Ce coupon ne s\'applique pas a cette offre')
      assert.equal(dbCoupon.amount_off, offer.reduc.amount_off, 'Le montant de la reduction ne correspond pas')
      assert.equal(dbCoupon.percent_off, offer.reduc.percent_off, 'Le pourcentage de la reduction ne correspond pas')
    }
    // 3) Checking client token
    assert.equal(token.email, req.user.email)

    // Stripe: Create customer for later charge
    return stripe.customers.create({
      email: token.email,
      source: token.id,
    })
  })
  .then(function(customer) {
    console.log('new customer: ', customer)
    var amount = offer.price

    if (offer.reduc) {
      amount -= offer.reduc.amount_off ? offer.reduc.amount_off : 0
      amount *= 1 - (offer.reduc.percent_off ? offfer.reduc.percent_off : 0)
    }

    // Stripe: Create charge on customer
    return stripe.charges.create({
      amount: amount * 100,
      currency: "eur",
      customer: customer.id,
      description: offer.type + ' for ' + req.user.firstName + ' ' + req.user.lastName,
      receipt_email: token.email,
      statement_descriptor: "Latoo " + req.body.offer.name + " sub"
    })
  })
  .then(function (charge) {
    console.log('charge created:', charge)

    // Save the payment infos
    var clientPayment = new Payment()

    clientPayment.userId = req.user._id
    clientPayment.package = req.body.offer.type
    clientPayment.payer_email = req.user.email
    clientPayment.payer_id = charge.customer
    clientPayment.subscr_id = charge.customer

    if (charge.status === 'succeeded') {
      clientPayment.status = 'OK'
      clientPayment.lastPaid = new Date()
      clientPayment.price = charge.amount / 100
      clientPayment.frequency = "Paiement unique"
    } else
      clientPayment.status = 'FAILED'
    
    return clientPayment.save()
  })
  .then(function (payment) {
    console.log('Payment done:', payment)
    return res.status(204).json(payment)
  })
  .catch(function (err) {
    console.error(err)
    return res.status(500).send('An error occurred ' + typeof err === Error ? err.toString() : JSON.stringify(err))
  })
}