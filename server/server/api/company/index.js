'use strict';

var express = require('express');
var controller = require('./company.controller');
var config = require('../../config/environment');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.get('/research', controller.smartSearch);
router.get('/:id', controller.show);
router.get('/', controller.research);
router.post('/companysImport', auth.isAuthenticated(), controller.importCompany);
router.post('/', auth.isAuthenticated(), controller.create);
router.put('/:id', auth.isAuthenticated(), controller.update);
router.post('/:id/images', auth.isAuthenticated(), controller.uploadImage);
router.get('/:id/images', controller.getImage);
router.patch('/:id', auth.isAuthenticated(), controller.update);
router.delete('/:id', auth.isAuthenticated(), controller.destroy);
router.patch('/', auth.isAuthenticated(), controller.updateGeoloc);
router.put('/:id/attribute', auth.isAuthenticated(), controller.attribute);
router.delete('/:id/attribute', auth.isAuthenticated(), controller.unlink);
module.exports = router;
