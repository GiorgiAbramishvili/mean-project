'use strict';

var express = require('express');
var controller = require('./offer.controller');

var router = express.Router();

router.get('/', controller.index);
router.get('/:id', controller.show);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.patch('/:id', controller.update);
router.delete('/:id', controller.destroy);
router.get('/:offer/image/:id', controller.getImage);
router.post('/:id/images', controller.uploadImages);
router.delete('/:offer/image/:id', controller.deleteImage);

module.exports = router;