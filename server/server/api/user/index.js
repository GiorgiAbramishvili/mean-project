'use strict';

var express = require('express');
var controller = require('./user.controller');
var config = require('../../config/environment');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.get('/', auth.hasRole('admin'), controller.index);
router.post('/forgotPassword', controller.sendForgotPasswordEmail);
router.post('/contactUs', controller.contactUs);
router.put('/setNewPassword', controller.setNewPassword);
router.post('/sendinvites', auth.isAuthenticated(), controller.sendInvites);
router.put('/deleteinvite', auth.isAuthenticated(), controller.deleteInvite);
router.delete('/:id', auth.hasRole('admin'), controller.destroy);
router.get('/me', auth.isAuthenticated(), controller.me);
router.put('/me', auth.isAuthenticated(), controller.updateMe);
router.put('/me/password', auth.isAuthenticated(), controller.changePassword);
router.get('/:id', auth.isAuthenticated(), controller.show);
router.post('/', controller.create);

module.exports = router;
