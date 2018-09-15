'use strict';

var _ = require('lodash');
var DataResearch = require('./dataResearch.model');
var Company = require('../company/company.model');
var companyFunc = require('../company/company.controller');

// Get list of dataResearchs
exports.index = function(req, res) {
  if (req.query.keyWord) {
    DataResearch.find({KEYWORD:{'$regex':req.query.keyWord, '$options':'i'}}, function (err, dataResearchs) {
      if(err) { return handleError(res, err); }
      if(!dataResearchs) { return res.status(404).send('Not Found'); }
      return res.status(200).json(dataResearchs);
    });
  } else {
      return res.status(204).send();
  }
};

// Get a single dataResearch
exports.show = function(req, res) {
  DataResearch.findById(req.params.id, function (err, dataResearch) {
    if(err) { return handleError(res, err); }
    if(!dataResearch) { return res.status(404).send('Not Found'); }
    return res.json(dataResearch);
  });
};

// Creates a new dataResearch in the DB.
exports.create = function(req, res) {
  DataResearch.create(req.body, function(err, dataResearch) {
    if(err) { return handleError(res, err); }
    return res.status(201).json(dataResearch);
  });
};

// Updates an existing dataResearch in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  DataResearch.findById(req.params.id, function (err, dataResearch) {
    if (err) { return handleError(res, err); }
    if(!dataResearch) { return res.status(404).send('Not Found'); }
    var updated = _.merge(dataResearch, req.body);
    updated.save(function (err) {
      if (err) { return handleError(res, err); }
      return res.status(200).json(dataResearch);
    });
  });
};

// Deletes a dataResearch from the DB.
exports.destroy = function(req, res) {
  DataResearch.findById(req.params.id, function (err, dataResearch) {
    if(err) { return handleError(res, err); }
    if(!dataResearch) { return res.status(404).send('Not Found'); }
    dataResearch.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.status(204).send('No Content');
    });
  });
};

function handleError(res, err) {
  return res.status(500).send(err);
}