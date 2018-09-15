'use strict';

var _ = require('lodash');
var CompanyInfos = require('./companyInfos.model');

// Get list of companyInfoss
exports.index = function(req, res) {
  if (req.query && req.query.siren) {
    CompanyInfos.findOne({'ID': req.query.siren}, function (err, companyInfos) {
      if(err) { return handleError(res, err); }
      if (!companyInfos) {
        return res.status(404).json('This company does not exist');
      }
      return res.status(200).json(companyInfos);
    });
  } else {
    CompanyInfos.find({}, function (err, companyInfos) {
      if(err) { return handleError(res, err); }
      return res.status(200).json(companyInfos);
    });
  }
};

// Get a single companyInfos
exports.show = function(req, res) {
  CompanyInfos.findById(req.params.id, function (err, companyInfos) {
    if(err) { return handleError(res, err); }
    if(!companyInfos) { return res.status(404).send('Not Found'); }
    return res.json(companyInfos);
  });
};

// Creates a new companyInfos in the DB.
exports.create = function(req, res) {
    console.log(req.body);
  CompanyInfos.create(req.body, function(err, companyInfos) {
    if(err) { console.error(err); return handleError(res, err); }
    console.log(res.body, companyInfos);
    return res.status(201).json(companyInfos);
  });
};

// Updates an existing companyInfos in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  CompanyInfos.findById(req.params.id, function (err, companyInfos) {
    if (err) { return handleError(res, err); }
    if(!companyInfos) { return res.status(404).send('Not Found'); }
    var updated = _.merge(companyInfos, req.body);
    CompanyInfos.update({_id: updated._id}, updated, function (err) {
      if (err) { return handleError(res, err); }
      return res.status(200).json(companyInfos);
    });
  });
};

// Deletes a companyInfos from the DB.
exports.destroy = function(req, res) {
  CompanyInfos.findById(req.params.id, function (err, companyInfos) {
    if(err) { return handleError(res, err); }
    if(!companyInfos) { return res.status(404).send('Not Found'); }
    companyInfos.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.status(204).send('No Content');
    });
  });
};

function handleError(res, err) {
  return res.status(500).send(err);
}