'use strict';

var _ = require('lodash');
var ManageCompany = require('./manageCompany.model');
var Company = require('../company/company.model');

// Get list of manageCompanys
exports.index = function (req, res) {
   
    
    // old company managament
    if (!req.query.filter) {

        var out = {};
        Company.count({}, function (err, count) {
            out.pagination = {
                maxPages: count / (req.query.limit || 10),
                currentPage: ((req.query.offset || 0) / (req.query.limit || 10)) + 1
            }
            Company.find({}, {}, { skip: req.query.offset || 0, limit: req.query.limit || 10 }, function (err, company) {
                if (err) { return handleError(res, err); }
                if (!company) { return res.status(404).send('Not Found'); }
                out.results = company;
                return res.status(200).json(out);
            });
        });

        // new company managament    
    } else {
        
        var localizedFilter = {"COOR.0.LAT": {$exists: true}};
        var nonLocalizedFilter = {"COOR.0.LAT": {$exists: false}};
        var activeFilter = (req.query.filter=='localized' ? localizedFilter: nonLocalizedFilter);
        if(req.query.filter=='all')
            activeFilter = {};

        var out = {};

        Company.count(localizedFilter, function (err, count) {
            if (err) { return handleError(res, err); }
            
            Company.count(nonLocalizedFilter, function (err, count2) {
                if (err) { return handleError(res, err); }
                
                var cnt = count;

                if(req.query.filter=='not_localized')
                    cnt = count2;
                else if(req.query.filter=='all')
                    cnt = count+count2;
                
                
                out.pagination = {
                    maxPages: cnt / (req.query.limit || 10),
                    currentPage: ((req.query.offset || 0) / (req.query.limit || 10)) + 1,
                    localized: count,
                    not_localized: count2
                }
                
                if(req.query.queryKey){
                    if(req.query.queryValue)
                        activeFilter[req.query.queryKey] = { $regex: '.*' + req.query.queryValue + '.*' , $options: 'i'};
                    else
                        activeFilter[req.query.queryKey] = '';

                }
                
                Company.find(activeFilter, {}, { 
                    skip: req.query.offset || 0, 
                    limit: req.query.limit || 10 
                }, function (err, company) {
                    if (err) { return handleError(res, err); }
                    if (!company) { return res.status(404).send('Not Found'); }
                    out.results = company;
                    return res.status(200).json(out);
                });
    
            });

        });
    }
};

// Get a single manageCompany
exports.show = function (req, res) {
    ManageCompany.findById(req.params.id, function (err, manageCompany) {
        if (err) { return handleError(res, err); }
        if (!manageCompany) { return res.status(404).send('Not Found'); }
        return res.json(manageCompany);
    });
};

// Creates a new manageCompany in the DB.
exports.create = function (req, res) {
    ManageCompany.create(req.body, function (err, manageCompany) {
        if (err) { return handleError(res, err); }
        return res.status(201).json(manageCompany);
    });
};

// Updates an existing manageCompany in the DB.
exports.update = function (req, res) {
    if (req.body._id) { delete req.body._id; }
    Company.findById(req.params.id, function (err, manageCompany) {
        if (err) { return handleError(res, err); }
        if (!manageCompany) { return res.status(404).send('Not Found'); }
        var updated = _.merge(manageCompany, req.body);
        updated.save(function (err) {
            if (err) { return handleError(res, err); }
            return res.status(200).json(manageCompany);
        });
    });
};

// Deletes a manageCompany from the DB.
exports.destroy = function (req, res) {
    ManageCompany.findById(req.params.id, function (err, manageCompany) {
        if (err) { return handleError(res, err); }
        if (!manageCompany) { return res.status(404).send('Not Found'); }
        manageCompany.remove(function (err) {
            if (err) { return handleError(res, err); }
            return res.status(204).send('No Content');
        });
    });
};

function handleError(res, err) {
    return res.status(500).send(err);
}