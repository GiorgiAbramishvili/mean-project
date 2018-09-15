'use strict';

var User = require('../user/user.model');
var Company = require('../company/company.model');
var Pricing = require('./pricing.model');
var Tpl = require('./pricing.tpl');
var passport = require('passport');
var config = require('../../config/environment');
var jwt = require('jsonwebtoken');
var generator = require('generate-password');
var path = require('path');
var fs = require('fs');
var nodemailer = require('nodemailer');
var validationError = function(res, err) {
  return res.status(422).json(err);
};

/**
 * Get list of users
 * restriction: 'admin'
 */
exports.index = function(req, res) {
  var out = {
    stats: {},
    last: {},
  };
  User.count({}, function(err, count) {
    out.stats.users = count;
    Company.count({}, function(err, count) {
      out.stats.companies = count;      
      User.find({}, 'firstName lastName email', {limit: 10}, function(err, users) {
        out.last.users = users;          
        Company.find({}, 'RAISON_SOC NOM', {limit: 10}, function(err, companies) {
          out.last.companies = companies;
          return res.status(200).json(out);
        });
      });
    });
  });
};


exports.createUser = function(req, res) {

  var transporter = nodemailer.createTransport('smtps://no-reply%40latoo.fr:latoo4ever@ssl0.ovh.net');
  let saveUserAfterCompanyVerif = function(r) {
    if (r && r.length) {
      res.status(403);
      throw {message: 'Cette société appartient déjà a un client'};
    }
    req.body.user.password = generator.generate({
        length: 6,
        numbers: false
    });
    let user = new User(req.body.user);
    return user.save();
  };
  let saveUserAfterUserVerif = function(r) {
    if (r && r.length) {
      res.status(409);
      throw {message: 'Cet email existe déjà'};
    }
    req.body.user.password = generator.generate({
        length: 6,
        numbers: false
    });
    let user = new User(req.body.user);
    console.log(user);
    let promise = user.save();
    return promise;
  };
  let reclaimCompany = function(r) {
    createdUser = r;
    return Company.update({_id: req.body.user.linkedCompany}, {$set: {RECLAIMED: createdUser._id}});
  };
  let companyReclaimed = function(r) {
    if (r && r.length) {
      res.status(409);
      throw {message: 'Cet email existe déjà'};
    }
    return Company.find({_id: req.body.user.linkedCompany, RECLAIMED: {$exists: true}});
  };
  let userExists = function(email) {
    return User.find({email: email});
  };
  res.status(500);
  if (req.body.user.linkedCompany) {
    var createdUser;
    userExists(req.body.user.email)
      .then(companyReclaimed)
      .then(saveUserAfterCompanyVerif)
      .then(reclaimCompany)
      .then(function() {
        if (req.body.mail && req.body.mail.send && req.body.mail.content) {
          req.body.mail.content = req.body.mail.content.replace(/\[MAIL\]/, req.body.user.email);
          req.body.mail.content = req.body.mail.content.replace(/\[PASSWORD\]/, req.body.user.password);
          var mailData = {
            from: 'no-reply@latoo.fr',
            to: req.body.user.email,
            subject: 'Latoo vous propose l\'annuaire gratuit des entreprises',
            html: req.body.mail.content
          };  
          transporter.sendMail(mailData, err => {console.log(err)});
        }
        res.status(201).json(createdUser);
      })
      .catch(function(err) {
        console.log(err);
        res.json(err);
      });
  } else {
    userExists(req.body.user.email)
      .then(saveUserAfterUserVerif)
      .then(function(createdUser) {
        if (req.body.mail && req.body.mail.send && req.body.mail.content) {
          req.body.mail.content = req.body.mail.content.replace(/\[MAIL\]/, req.body.user.email);
          req.body.mail.content = req.body.mail.content.replace(/\[PASSWORD\]/, req.body.user.password);
          var mailData = {
            from: 'no-reply@latoo.fr',
            to: req.body.user.email,
            subject: 'Latoo vous propose l\'annuaire gratuit des entreprises',
            html: req.body.mail.content
          };  
          transporter.sendMail(mailData, err => {console.log(err)});
        }
        res.status(201).json(createdUser);
      })
      .catch(function(err) {
        console.log(err);
        res.json(err);
      });
  }
};

exports.searchUsers = function(req, res) {
  if (!req.query.search) {
    return res.status(200).json([]);
  }
  let keywords = req.query.search.split(' ');
  let array = [];
  keywords.forEach(v => {
    array.push(new RegExp('^' + v + '*', 'gi'));
  });
  User.find({
        $or: [{'firstName': {'$in' : array}},
              {'lastName': {'$in' : array}},
              {'email': {'$in' : array}}]
    }, {}, {limit: 20}, function (err, company) {
        if (err) {return handleError(res, err);}
        if (!company) {return res.status(404).send('Not Found');}
        return res.status(200).json(company);
    });
};

exports.deleteUser = function(req, res) {
  User.findById(req.params.id).then(user => {
    if (user.linkedCompany) {
      Company.update({_id: user.linkedCompany}, {$unset: {RECLAIMED: ''}}).then(d => {
        User.remove({_id: user._id}).then(success => {
          return res.status(204).send();
        });
      });
    } else {
      User.remove({_id: user._id}).then(success => {
          return res.status(204).send();
      });
    }
  }).catch(err => {
    return res.send(err);
  });
};

exports.updateUser = function(req, res) {
  let update = function(user) {    
      if (req.body.deleteLink) {
        Company.update({_id: user.linkedCompany}, {$unset: {RECLAIMED: ''}})
        .then(u => {
          User.update({_id: req.params.id}, {$set: req.body, $unset: {linkedCompany: ''}}).then(updated => {
            return res.status(200).send('ok');
          });
        });
      } else if (req.body.linkedCompany && req.body.linkedCompany !== user.linkedCompany) {        
        Company.findById(req.body.linkedCompany).then(linked => {
          if (linked && linked.RECLAIMED && linked.RECLAIMED.length) {
            res.status(409);
            throw ({message: 'Cette société est déjà liée à un autre compte'});
          }
          let newCompany = function() {
            Company.update({_id: req.user.linkedCompany}, {$set: {RECLAIMED: req.params.id}})
            .then(u => {
              User.update({_id: req.params.id}, req.body).then(updated => {
                return res.status(200).send('ok');
              });
            });
          }
          if (user.linkedCompany) {
            Company.update({_id: user.linkedCompany}, {$unset: {RECLAIMED: ''}}).then(newCompany);
          } else {
            newCompany();
          }
        });
        
      } else {
        User.update({_id: req.params.id}, req.body).then(updated => {
          return res.status(200).send('ok');
        });
      }
  }
  User.findById(req.params.id).then(user => {
    if (req.body.email !== user.email) {      
      User.find({email: req.body.email}).then(emailRes => {
        if (emailRes && emailRes.length > 0) {
          res.status(409);
          throw ({message: 'Cet email est déjà attribué'});
        }
        return update(user);
      });
    } else {
      return update(user);
    }
  }).catch(err => {
    res.send(err);
  });
};

exports.getImage = function(req, res) {
  fs.stat('./images/home.mp4', function(err, stats) {
    if (err) {
      return res.status(404).send();
    }
    else if (stats.isFile()) {
      return res.sendFile(path.resolve('./images/home.mp4'));
    } else {
      return res.status(404).send();
    }
  });
};
exports.uploadHomeCover = function(req, res) {
  var tempPath = req.files.file.path,
      targetPath = path.resolve('./images/home' + path.extname(req.files.file.name).toLowerCase());
  fs.unlink('./images/home.mp4', function () {   
    fs.rename(tempPath, targetPath, function(err) {
        if (err) throw err;
        return res.status(204).send();
    });
  });
};

exports.getTargetNumber = function(req, res) {
  console.log(req.query.type);
  User.count({role: req.query.type}).then(users => {
    return res.status(200).json({total: users});
  }, err => {
    return res.status(500).send(err);
  });
};

exports.saveTpl = function(req, res) {  
    
    var mailData = {
        subject: req.body.title,
        html: req.body.content
    };  

    Tpl.create(mailData).then(users => {
        return res.status(200).send();
    }, err => {
     return res.status(500).send(err);
    });

};

exports.getTpl = function(req, res) {  
    
    Tpl.find({}).then(function (dbres) {
        return res.json(dbres)
    }, function (err) {
        return res.status(500).send(err)
    });

};

exports.setActiveTpl = function(req, res){
    var type = req.body.type;
    var _id = req.body.tpl['_id'];

    if(!_id)
        return res.status(500).send();

    Tpl.find({}).then(function (tpls) {
        tpls.forEach(function(t){
            
            var updateObj = {active: (_id==t._id)}

            if(type=='invite')
                updateObj = {activeInvite: (_id==t._id)}


            Tpl.update({_id: t._id}, updateObj, function(err, data){
                console.log('EEERRRR', err, data)
            });

        });
        
        return res.status(200).send();
    }, function (err) {
        return res.status(500).send(err)
    });
}

exports.sendMailing = function(req, res) {  
  var transporter = nodemailer.createTransport('smtps://no-reply%40latoo.fr:latoo4ever@ssl0.ovh.net');
  if (req.body.specific) {
    let ids = [];
    req.body.users.forEach(u => {
      ids.push(u._id);
    });
    User.find({_id: {$in: ids}}).then(users => {
      users.forEach(function(u) {
        var mailData = {
              from: 'no-reply@latoo.fr',
              to: u.email,
              subject: req.body.title,
              html: req.body.content
        };  
        transporter.sendMail(mailData, err => {if (err)console.log(err)});
      });
      return res.status(200).send();
    }, err => {
      return res.status(500).send(err);
    })
  } else {
    User.find({role: req.body.type}).then(users => {
      users.forEach(function(u) {
        var mailData = {
              from: 'no-reply@latoo.fr',
              to: u.email,
              subject: req.body.title,
              html: req.body.content
        };  
        transporter.sendMail(mailData, err => {if (err)console.log(err)});
      });
      return res.status(200).send();
    }, err => {
      return res.status(500).send(err);
    });
  }
};

/**
 * Authentication callback
 */
exports.authCallback = function(req, res, next) {
  res.redirect('/');
};

exports.getActivePricing = function(req, res) {
  var now = new Date(Date.now())
  Pricing.PricingOffer.find({
    from: { $lt: now },
    to: { $gt: now }
  }).then(function (dbres) {
    return res.json(dbres)
  }, function (err) {
    console.log(err)
    return res.status(500).send(err)
  })
}

exports.getPricing = function (req, res) {
  Pricing.PricingOffer.find({}).then(function (dbres) {
    return res.json(dbres)
  }, function (err) {
    console.log(err)
    return res.status(500).send(err)
  })
}

exports.savePricing = function (req, res) {
  console.log(req.body)
  let upsert = req.body
  delete upsert._id
  Pricing.PricingOffer.update({type:req.body.type}, upsert, {upsert: true}, function (err, dbres) {
    if (err) return res.status(500).send(err)
    console.log(dbres)
    return res.status(200).json(dbres)
  })
}

exports.delPricing = function (req, res) {
  console.log(req.params.type)
  Pricing.Coupon.remove({type: req.params.type}, function (err, dbres) {
    if (err) return res.status(500).send(err)
    console.log(dbres)
    Pricing.PricingOffer.remove({type: req.params.type}, function (err, dbres) {
      if (err) return res.status(500).send(err)
      console.log(dbres)
      return res.status(200).json(dbres)
    })
  })
}


exports.getCouponsInfos = function (req, res) {
  Pricing.Coupon.find({code: req.params.code}).then(function (dbres) {
    if (dbres.length > 0) {
      if(new Date(dbres[0].from) < new Date() &&  new Date(dbres[0].to) > new Date()) {
        return res.status(200).json({
          code: dbres[0].code,
          type: dbres[0].type,
          amount_off: dbres[0].amount_off,
          percent_off: dbres[0].percent_off
        })
      } else
        return res.status(403).json('Coupon actuellement non valable')
    } else
      return res.status(404).json('Coupon introuvable')
  }, function (err) {
    console.log(err)
    return res.status(500).send(err)
  })
}

exports.getCoupons = function (req, res) {
  Pricing.Coupon.find({}).then(function (dbres) {
    return res.json(dbres)
  }, function (err) {
    console.log(err)
    return res.status(500).send(err)
  })
}

exports.saveCoupon = function (req, res) {
  console.log(req.body)
  let upsert = req.body
  delete upsert._id
  Pricing.Coupon.update({code:req.body.code}, upsert, {upsert: true}, function (err, dbres) {
    if (err) return res.status(500).send(err)
    console.log(dbres)
    return res.status(200).json(dbres)
  })
}

exports.delCoupon = function (req, res) {
  console.log(req.params)
  Pricing.Coupon.remove({code: req.params.code}, function (err, dbres) {
    if (err) return res.status(500).send(err)
    console.log(dbres)
    return res.status(200).json(dbres)
  })
}