'use strict';

var express = require('express');
var controller = require('./admin.controller');
var config = require('../../config/environment');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.get('/stats', auth.hasRole('admin'), controller.index);
router.post('/users', auth.hasRole('admin'), controller.createUser);
router.get('/users', auth.hasRole('admin'), controller.searchUsers);
router.put('/users/:id', auth.hasRole('admin'), controller.updateUser);
router.delete('/users/:id', auth.hasRole('admin'), controller.deleteUser);
router.post('/params/homeCover', auth.hasRole('admin'), controller.uploadHomeCover);

router.get('/tpl', auth.hasRole('admin'), controller.getTpl);
router.post('/saveTpl', auth.hasRole('admin'), controller.saveTpl);
router.post('/setActiveTpl', auth.hasRole('admin'), controller.setActiveTpl);

router.get('/mails', auth.hasRole('admin'), controller.getTargetNumber);
router.post('/mails', auth.hasRole('admin'), controller.sendMailing);
router.get('/homeCover', controller.getImage);
router.get('/activePricing', controller.getActivePricing);
router.get('/pricing', auth.hasRole('admin'), controller.getPricing);
router.put('/pricing', auth.hasRole('admin'), controller.savePricing);
router.delete('/pricing/:type', auth.hasRole('admin'), controller.delPricing);
router.get('/couponInfo/:code', controller.getCouponsInfos);
router.get('/coupon', auth.hasRole('admin'), controller.getCoupons);
router.put('/coupon', auth.hasRole('admin'), controller.saveCoupon);
router.delete('/coupon/:code', auth.hasRole('admin'), controller.delCoupon);

module.exports = router;