'use strict';

var _ = require('lodash');
var User = require('../user/user.model');
var Company = require('./company.model');
var CompanyInfos = require('../companyInfos/companyInfos.model');
var Offer = require('../companyOffers/offer.model');
var extra = {
    provider: 'google',
    httpAdapter: 'https',
    apiKey: 'AIzaSyDmf3oFgt7boD72HPPSJZmN6G4cv3U86wk'
};
var NodeGeocoder = require('node-geocoder');
/* jshint ignore:start */
var geocoder = NodeGeocoder(extra);
/* jshint ignore:end */
var mongodb = require('mongodb');
var path = require('path');
var fs = require('fs');

// Get a single company
exports.show = function (req, res) {
    Company.findById(req.params.id, function (err, company) {
        if (err) { return handleError(res, err); }
        if (!company) { return res.status(404).send('Not Found'); }
        CompanyInfos.findOne({ ID: company.SIREN }, function (err, infos) {
            if (err) { return handleError(res, err); }
            Offer.find({ COMPANY: company._id }, function (err, offers) {
                if (err) { return handleError(res, err); }
                return res.status(200).json({ company: company, infos: infos, offers: offers });
            })
        });
    })
};

// Get many companies by research
exports.research = function (req, res) {
    if (req.query.idCompany) {
        Company.findOne({ _id: req.query.idCompany }, function (err, company) {
            if (err) { return handleError(res, err); }
            if (!company) { return res.status(404).send('Not Found'); }
            CompanyInfos.findOne({ ID: company.SIREN }, function (err, infos) {
                if (err) { return handleError(res, err); }
                return res.status(200).json({ company: company, infos: infos });
            });
        });
    } else if (req.query.ape) {
        console.log(req.query.ape, [req.query.lng, req.query.lat]);
        let array = [];
        let apes = JSON.parse(req.query.ape);
        apes.forEach(v => {
            array.push(new RegExp('^' + v, 'i'));
        });
        console.log((parseFloat(req.query.md) || 3000.0) / 63710.0);
        Company.find({ APE: { $in: array }, LOC: { $near: [req.query.lng, req.query.lat], $maxDistance: (parseFloat(req.query.md) || 3000.0) / 111120.0 } })
            .then(company => {
                if (!company) { return res.status(404).send('Not Found'); }
                return res.status(200).json(company);
            });
        return null;
    } else if (req.query.keyword !== "") {
        Company.find({
            $or: [{ 'APE': { '$regex': req.query.keyword, '$options': 'i' } },
            { 'NOM': { '$regex': req.query.keyword, '$options': 'i' } },
            { 'RAISON_SOC': { '$regex': req.query.keyword, '$options': 'i' } }]
        }, {}, { limit: 10 }, function (err, company) {
            if (err) { return handleError(res, err); }
            if (!company) { return res.status(404).send('Not Found'); }
            return res.status(200).json(company);
        });
    }
};

// Imports company from CSV, checks if exist etc
exports.importCompany = function (req, res) {

    Company.findOne({ 'ADRESSE': req.body.ADRESSE }, function (err, company) {

        if (err) { return handleError(res, err); }

        if (!company) {

            Company.create(req.body, function (err, company) {

                if (err) { return handleError(res, err); }

                if (company && company.ADRESSE && company.VILLE && company.CP) {
                    // jshint ignore:start 
                    var geoCode = company.ADRESSE + ' ' + company.VILLE + ' ' + company.CP.toString();

                    geocoder.geocode(geoCode).then(function (georesponse) {

                        company.COOR = [];
                        company.COOR.push({ LAT: georesponse[0].latitude });
                        company.COOR.push({ LNG: georesponse[0].longitude });


                        if (!georesponse[0].latitude && !georesponse[0].longitude)
                            return res.send('not_localized');

                        company.save(function (err) {

                            if (err) return handleError(err);

                            return res.send('localized');

                        });
                    })
                        .catch(function (err) {
                            return res.send('not_localized');
                        });
                    // jshint ignore:end 
                }

                //return res.status(201).json(company);

            });

        } else {

            if ((company.COOR && company.COOR[0] && company.COOR[0]['LAT'] && company.COOR[0]['LAT'] > 0)
                && (company.COOR && company.COOR[1] && company.COOR[1]['LNG'] && company.COOR[1]['LNG'] > 0)) {
                
                    return res.send('exists_localized');

            } 
            else {

                //return res.send('exists_not_localized');
                if (company && company.ADRESSE && company.VILLE && company.CP) {
                    
                    var geoCode = company.ADRESSE + ' ' + company.VILLE + ' ' + company.CP.toString();

                    geocoder.geocode(geoCode).then(function (georesponse) {

                        company.COOR = [];
                        company.COOR.push({ LAT: georesponse[0].latitude });
                        company.COOR.push({ LNG: georesponse[0].longitude });


                        if (!georesponse[0].latitude && !georesponse[0].longitude)
                            return res.send('exists_not_localized');

                        company.save(function (err) {

                            if (err) return handleError(err);

                            return res.send('exists_localized');

                        });
                    })
                        .catch(function (err) {
                            return res.send('exists_not_localized');
                        });
                    
                }
            }
        }

    });

    /* Company.create(req.body, function(err, company) {
      if(err) { return handleError(res, err); }
      User.update({_id: req.user._id}, 
        {linkedCompany: company._id}, function(err, user) {
        if(err) { return handleError(res, err); }
        if (company && company.ADRESSE && company.VILLE && company.CP){
                // jshint ignore:start 
          geocoder.geocode(company.ADRESSE + ' ' + company.VILLE + ' ' + company.CP.toString())
              .then(function(res) {
                company.COOR = [];
                company.COOR.push({LAT: res[0].latitude});
                company.COOR.push({LNG: res[0].longitude});
                company.save(function (err) {
                  if (err) return handleError(err);
                });
              })
              .catch(function(err) {
                console.log(err);
              });
                // jshint ignore:end 
        }
      });
      return res.status(201).json(company);
    }); */
};

// Creates a new company in the DB.
exports.create = function (req, res) {
    req.body.RECLAIMED = req.user._id;
    console.log(req.body);
    Company.create(req.body, function (err, company) {
        if (err) { return handleError(res, err); }
        User.update({ _id: req.user._id },
            { linkedCompany: company._id }, function (err, user) {
                if (err) { return handleError(res, err); }
                if (company && company.ADRESSE && company.VILLE && company.CP) {
                    /* jshint ignore:start */
                    geocoder.geocode(company.ADRESSE + ' ' + company.VILLE + ' ' + company.CP.toString())
                        .then(function (res) {
                            company.COOR = [];
                            company.COOR.push({ LAT: res[0].latitude });
                            company.COOR.push({ LNG: res[0].longitude });
                            company.save(function (err) {
                                if (err) return handleError(err);
                            });
                        })
                        .catch(function (err) {
                            console.log(err);
                        });
                    /* jshint ignore:end */
                }
            });
        return res.status(201).json(company);
    });
};
exports.getImage = function (req, res) {
    fs.stat('./images/' + req.query.type + '/' + req.params.id + '.png', function (err, stats) {
        if (err) {
            fs.stat('./images/' + req.query.type + '/' + req.params.id + '.jpg', function (err, stats) {
                if (err) {
                    return res.status(200).sendFile(path.resolve('./images/' + req.query.type + '/default.jpg'));
                }
                if (stats.isFile()) {
                    return res.status(200).sendFile(path.resolve('./images/' + req.query.type + '/' + req.params.id + '.jpg'));
                } else {
                    return res.status(200).sendFile(path.resolve('./images/' + req.query.type + '/default.jpg'));
                }
            });
        }
        else if (stats.isFile()) {
            return res.sendFile(path.resolve('./images/' + req.query.type + '/' + req.params.id + '.png'));
        } else {
            fs.stat('./images/' + req.query.type + '/' + req.params.id + '.jpg', function (err, stats) {
                if (err) {
                    return res.status(200).sendFile(path.resolve('./images/' + req.query.type + '/default.jpg'));
                }
                if (stats.isFile()) {
                    return res.status(200).sendFile(path.resolve('./images/' + req.query.type + '/' + req.params.id + '.jpg'));
                } else {
                    return res.status(200).sendFile(path.resolve('./images/' + req.query.type + '/default.jpg'));
                }
            });
        }
    });
};
exports.uploadImage = function (req, res) {
    if (!req.body.type || (req.body.type !== 'profile' && req.body.type !== 'cover'))
        return res.status(400).send('Bad type');
    var tempPath = req.files.file.path,
        targetPath = path.resolve('./images/' + req.body.type + '/' + req.params.id + path.extname(req.files.file.name).toLowerCase());
    console.log(req.files.file);
    if (path.extname(req.files.file.name).toLowerCase() === '.png' ||
        path.extname(req.files.file.name).toLowerCase() === '.jpg') {
        console.log("Start unlink");
        fs.unlink('./images/' + req.body.type + '/' + req.params.id + '.png', function () {
            console.log("Unlink completed");
            fs.rename(tempPath, targetPath, function (err) {
                if (err) throw err;
                console.log("Upload completed!");
                return res.status(204).send();
            });
        });
    } else {
        fs.unlink(tempPath, function () {
            if (err) throw err;
            return res.status(422).send("Only .png and .jpg files are allowed!");
        });
    }
};
// Update Geoloc DB
exports.updateGeoloc = function (req, res) {
    Company.find({ $and: [{ VILLE: { $exists: true } }, { COOR: { $size: 0 } }] }, function (err, company) {
        company.slice(0, 2500).forEach(function (oneCompany) {
            if (oneCompany.ADRESSE && oneCompany.VILLE && oneCompany.CP) {
                /* jshint ignore:start */
                geocoder.geocode(oneCompany.ADRESSE + ',' + oneCompany.VILLE + ',' + oneCompany.CP.toString())
                    .then(function (res) {
                        oneCompany.COOR.push({ LAT: res[0].latitude });
                        oneCompany.COOR.push({ LNG: res[0].longitude });
                        oneCompany.save(function (err) {
                            if (err) return handleError(err);
                        });
                    })
                    .catch(function (err) {
                    });
                /* jshint ignore:end */
            }
        });
        if (err) { return handleError(res, err); }
        return res.status(200).json(company);
    });
};

// Updates an existing company in the DB.
exports.update = function (req, res) {
    if (req.body._id) { delete req.body._id; }
    Company.findById(req.params.id, function (err, company) {
        if (err) { return handleError(res, err); }
        if (!company) { return res.status(404).send('Not Found'); }
        Company.update({ _id: company._id }, { $set: req.body }, function (err) {
            if (err) { return handleError(res, err); }
            return res.status(200).json(company);
        });
    });
};

exports.attribute = function (req, res) {
    if (req.params.id) {
        Company.findById(req.params.id, function (err, company) {
            if (err) { return handleError(res, err); }
            if (!company) { return res.status(404).send('Not Found'); }
            if (company.RECLAIMED) {
                return res.status(403).send('Already assigned');
            } else {
                User.findById(req.user._id, function (err, user) {
                    if (err) { return handleError(res, err); }
                    if (!user) { return res.status(404).send('No such user'); }
                    if (user.linkedCompany) {
                        return res.status(401).json('Already owns a company');
                    } else {
                        Company.update({ _id: company._id }, { '$set': { RECLAIMED: req.user._id } }, function (err, updated) {
                            if (err) { return handleError(res, err); }
                            User.update({ _id: req.user._id }, { $set: { linkedCompany: company._id } }, function (err, userUpdated) {
                                if (err) { return handleError(res, err); }
                                return res.status(200).json('ok');
                            });
                        });
                    }
                });
            }
        });
    }
};


exports.unlink = function (req, res) {
    if (req.params.id) {
        Company.findById(req.params.id, function (err, company) {
            if (err) { return handleError(res, err); }
            if (!company) { return res.status(404).send('Not Found'); }
            if (company.RECLAIMED.toString() !== req.user._id.toString()) {
                return res.status(403).send('Not user\'s company');
            } else {
                User.findById(req.user._id, function (err, user) {
                    if (err) { return handleError(res, err); }
                    if (!user) { return res.status(404).send('No such user'); }
                    if (user.linkedCompany.toString() !== company._id.toString()) {
                        return res.status(401).json('Not user\'s company');
                    } else {
                        Company.update({ _id: company._id }, { '$unset': { RECLAIMED: '' } }, function (err, updated) {
                            if (err) { return handleError(res, err); }
                            User.update({ _id: req.user._id }, { $unset: { linkedCompany: '' } }, function (err, userUpdated) {
                                if (err) { return handleError(res, err); }
                                return res.status(200).json('ok');
                            });
                        });
                    }
                });
            }
        });
    }
};

// Deletes a company from the DB.
exports.destroy = function (req, res) {
    Company.findById(req.params.id, function (err, company) {
        if (err) { return handleError(res, err); }
        if (!company) { return res.status(404).send('Not Found'); }
        var siren = company.SIREN;
        Company.remove({ _id: req.params.id }, function (err) {
            if (err) { return handleError(res, err); }
            CompanyInfos.remove({ ID: siren }, function (err) {
                return res.status(204).send();
            });
        });
    });
};

exports.smartSearch = function (req, res) {
    var keyword = new RegExp('^' + req.query.keyword + '*', 'gi');
    console.log(req.query.lat, req.query.lng);
    Company.find({
        $or: [
            { TAGS: { $in: [keyword] } },
            { RAISON_SOC: keyword }
        ],
        LOC: {
            $near: [req.query.lng, req.query.lat],
            $maxDistance: req.query.md || 500,
        }
    }).then(companies => {
        return res.status(200).json(companies);
    }).catch(err => {
        return res.status(200).send([]);
    });
};

function handleError(res, err) {
    return res.status(500).send(err);
}
