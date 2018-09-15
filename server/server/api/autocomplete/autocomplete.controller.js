'use strict';

var _ = require('lodash');
var Company = require('../company/company.model');
var DataResearch = require('../dataResearch/dataResearch.model');
var Autocomplete = require('./autocomplete.model');

// Get list of autocompletes
exports.autoCompleteResearch = function(req, res) {
  if (req.query.location) {
    Company.find({VILLE: {'$regex': '^' + req.query.location, '$options': 'i'}}, function (err, company) {
      if (err) {
        return handleError(res, err);
      }
      if (!company) {
        return res.status(404).send('Not Found');
      }
      return res.json(company);
    });
  } if (req.query.keyword) {
    var keyword = new RegExp('^' + req.query.keyword + '*', 'gi');
    DataResearch.find({KEYWORD: keyword}, function (err, dataResearchRes) {
      if (err) return handleError(res, err)
      // if (!company) return res.status(404).send('Not Found')

      Company.find({$or: [
        {RAISON_SOC: keyword},
        {TAGS: {$in: [keyword]}} ]}).limit(10).exec(function (err, companies) {
        if (err) return handleError(res, err)
        dataResearchRes.push(...companies.map(company => ({
          KEYWORD: company.RAISON_SOC + ', ' + company.TAGS.join(', ')
        })))
        if (!dataResearchRes) return res.status(404).send('Not Found');
        console.log(dataResearchRes)
        return res.json(dataResearchRes);  
      })
    });
  }
};

// Get a single autocomplete
exports.show = function(req, res) {
  Autocomplete.findById(req.params.id, function (err, autocomplete) {
    if(err) { return handleError(res, err); }
    if(!autocomplete) { return res.status(404).send('Not Found'); }
    return res.json(autocomplete);
  });
};

// Creates a new autocomplete in the DB.
exports.create = function(req, res) {
  Autocomplete.create(req.body, function(err, autocomplete) {
    if(err) { return handleError(res, err); }
    return res.status(201).json(autocomplete);
  });
};

// Updates an existing autocomplete in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  Autocomplete.findById(req.params.id, function (err, autocomplete) {
    if (err) { return handleError(res, err); }
    if(!autocomplete) { return res.status(404).send('Not Found'); }
    var updated = _.merge(autocomplete, req.body);
    updated.save(function (err) {
      if (err) { return handleError(res, err); }
      return res.status(200).json(autocomplete);
    });
  });
};

// Deletes a autocomplete from the DB.
exports.destroy = function(req, res) {
  Autocomplete.findById(req.params.id, function (err, autocomplete) {
    if(err) { return handleError(res, err); }
    if(!autocomplete) { return res.status(404).send('Not Found'); }
    autocomplete.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.status(204).send('No Content');
    });
  });
};

function handleError(res, err) {
  return res.status(500).send(err);
}