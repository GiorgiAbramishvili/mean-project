'use strict';

var express = require('express');
var passport = require('passport');
var auth = require('../auth.service');
var config = require('../../config/environment');
var router = express.Router();

router
  .get('/', passport.authenticate('facebook', {
    scope: ['email', 'user_about_me', 'public_profile', 'user_friends', 'publish_actions'],
    failureRedirect: config.hosts.appHomeUrl,
    session: false
  }))

  .get('/callback', passport.authenticate('facebook', {
    failureRedirect: config.hosts.appHomeUrl,
    session: false
  }), auth.setTokenCookie);

module.exports = router;