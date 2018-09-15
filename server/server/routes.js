/**
 * Main application routes
 */

'use strict';

var errors = require('./components/errors');
var path = require('path');

module.exports = function(app) {

  // Insert routes below
  app.use('/offers', require('./api/companyOffers'));
  app.use('/companyInfos', require('./api/companyInfos'));
  app.use('/manageCompanys', require('./api/manageCompany'));
  app.use('/dataResearchs', require('./api/dataResearch'));
  app.use('/autocompletes', require('./api/autocomplete'));
  app.use('/companys', require('./api/company'));
  app.use('/payments', require('./api/payment'));
  app.use('/users', require('./api/user'));
  app.use('/admin', require('./api/admin'));

  app.use('/auth', require('./auth'));
  
  // All undefined asset or api routes should return a 404
  app.route('/:url(auth|components|app|bower_components|assets)/*')
   .get(errors[404]);

};
