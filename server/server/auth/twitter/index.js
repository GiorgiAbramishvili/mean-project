'use strict';

var express = require('express');
var passport = require('passport');
var auth = require('../auth.service');
var config = require('../../config/environment');
var router = express.Router();

router
  .get('/', passport.authenticate('twitter', {
    failureRedirect: config.hosts.appHomeUrl,
    session: false
  }))

  .get('/callback', passport.authenticate('twitter', {
    failureRedirect: config.hosts.appHomeUrl,
    session: false
  }), auth.setTokenCookie);

module.exports = router;