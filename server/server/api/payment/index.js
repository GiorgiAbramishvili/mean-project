'use strict';

var express = require('express');
var controller = require('./payment.controller');
var config = require('../../config/environment');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.post('/ipn', controller.index);
router.get('/me', auth.isAuthenticated(), controller.getMyPayments);
router.post('/stripe', auth.isAuthenticated(), controller.stripeCheckout)

module.exports = router;
