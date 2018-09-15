'use strict';

var _ = require('lodash');
var Offer = require('./offer.model');
var shortid = require('shortid')
var fs = require('fs')
var path = require('path')
// Get list of offers
exports.index = function(req, res) {
  if (req.query && req.query.id) {
    Offer.findOne({'ID': req.query.id}, function (err, offer) {
      if(err) { return handleError(res, err); }
      if (!offer) {
        return res.status(404).json('This offer does not exist');
      }
      return res.status(200).json(offer);
    });
  } else {
    Offer.find({}, function (err, offer) {
      if(err) { return handleError(res, err); }
      return res.status(200).json(offer);
    });
  }
};

// Get a single offer
exports.show = function(req, res) {
  Offer.findById(req.params.id, function (err, offer) {
    if(err) { return handleError(res, err); }
    if(!offer) { return res.status(404).send('Not Found'); }
    return res.json(offer);
  });
};

// Creates a new offer in the DB.
exports.create = function(req, res) {
  console.log('saving: ', req.body);
  Offer.create(req.body, function(err, offer) {
    if(err) { console.error(err); return handleError(res, err); }
    console.log(offer);
    return res.status(201).json(offer);
  });
};

// Updates an existing offer in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  Offer.findById(req.params.id, function (err, offer) {
    if (err) { return handleError(res, err); }
    if(!offer) { return res.status(404).send('Not Found'); }
    var updated = _.merge(offer, req.body);
    updated.PICS = req.body.PICS
    Offer.update({_id: updated._id}, updated, function (err) {
      if (err) { return handleError(res, err); }
      return res.status(200).json(offer);
    });
  });
};

// Deletes a offer from the DB.
exports.destroy = function(req, res) {
  Offer.findById(req.params.id, function (err, offer) {
    if(err) { return handleError(res, err); }
    if(!offer) { return res.status(404).send('Not Found'); }
    //TO DO: delete all linked pics
    Offer.remove(offer, function(err) {
      if(err) { return handleError(res, err); }
      return res.status(204).send('No Content');
    });
  });
};

exports.deleteImage = function (req, res) {
  Offer.findById(req.params.offer, function (err, offer) {
    if(err) return handleError(res, err)
    if(!offer) return res.status(404).send('Not Found (offer)')

    if (_.indexOf(offer.PICS), req.params.id != -1) {
      try {
        fs.unlinkSync(path.resolve('./images/offers/' + req.params.offer + '/' + req.params.id + '.jpg'))
      } catch (err) {
        try {
          fs.unlinkSync(path.resolve('./images/offers/' + req.params.offer + '/' + req.params.id + '.png'))
        } catch (err) { return res.status(404).send('Not found') }
      }
      return res.status(200).send('deleted')
    } else {
      return res.status(404).send('Not found')
    }
  })
}

exports.uploadImages = function(req, res) {
  Offer.findById(req.params.id, function (err, offer) {
    if(err) { return handleError(res, err); }
    if(!offer) { return res.status(404).send('Not Found'); }

    var savingPromise = req.files.files.map(function (file) {
      return new Promise(function (res, rej) {
        var tmpPath = file.lfFile.path
        var id = shortid.generate()
        var ext = path.extname(file.lfFile.name).toLowerCase()
        var targetPath = path.resolve('./images/offers/' + req.params.id + '/' + id + ext);
        if (ext === '.png' || ext === '.jpg') {
          try {
            fs.mkdirSync(path.resolve('./images/offers/' + req.params.id + '/'))
          } catch(e) {}
          fs.unlink(targetPath, function () {
            fs.rename(tmpPath, targetPath, function(err) {
              if (err) return res('err')
              return res(id)
            })
          })
        } else {
          fs.unlink(tmpPath, function (err) {
            console.log('no jpg or png: ', err)
            if (err) return res('err')
          })
        }
      })
    })

    Promise.all(savingPromise).then(function (saved) {
      console.log(saved)
      offer.PICS = offer.PICS.concat(saved.filter(x => x!='err'))
      console.log(offer.PICS)
      Offer.update({_id: offer._id}, offer, function (err) {
        if (err) { return handleError(saved, err); }
        return res.status(200).json(offer);
      });
    }).catch(function (err) {
      console.error('all error: ', err)
    })
  });
}

exports.getImage = function(req, res) {
  fs.stat('./images/offers/' + req.params.offer + '/' + req.params.id + '.png', function(err, stats) {
    if (err) {
      fs.stat('./images/offers/' + req.params.offer + '/' + req.params.id + '.jpg', function(err, stats) {
        if (err || !stats.isFile()) return res.status(404).send('Not found')
        return res.status(200).sendFile(path.resolve('./images/offers/' + req.params.offer + '/' + req.params.id + '.jpg'));
      });
    } else {
      if (!stats.isFile()) return res.status(404).send('Not found')
      return res.sendFile(path.resolve('./images/offers/' + req.params.offer + '/' + req.params.id + '.png'));
    }
  });
}

function handleError(res, err) {
  return res.status(500).send(err);
}