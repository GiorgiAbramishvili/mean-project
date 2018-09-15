/**
 * Populate DB with sample data on server start
 * to disable, edit config/environment/index.js, and set `seedDB: false`
 */

'use strict';

var User = require('../api/user/user.model');
var DataResearch = require('../api/dataResearch/dataResearch.model');
var path = require('path');
var jsonfile = require('jsonfile');
var file = path.join(__dirname,'../api/dataResearch/dataResearch.json');


DataResearch.find({}).remove(function () {
  var obj = jsonfile.readFileSync(file);
  DataResearch.create(obj);
});

