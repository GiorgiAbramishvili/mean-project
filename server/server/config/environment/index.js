'use strict';

var path = require('path');
var _ = require('lodash');

function requiredProcessEnv(name) {
  if(!process.env[name]) {
    throw new Error('You must set the ' + name + ' environment variable');
  }
  return process.env[name];
}

// All configurations will extend these options
// ============================================
var hosts = {
    // appHomeUrl: 'http://localhost:9001/#!/app/home',
    // host: 'http://localhost:9001',
    // apiUri: 'http://locahost:9000',

  apiUri: 'https://api.latoo.fr',
  host: 'https://latoo.fr',
  appHomeUrl: 'https://latoo.fr/#!/app/home'

};
var all = {

  hosts: hosts,

  env: process.env.NODE_ENV,

  // Root path of server
  root: path.normalize(__dirname + '/../../..'),

  // Server port
  port: process.env.PORT || 9000,

  // Server IP
  ip: process.env.IP || '0.0.0.0',

  // Should we populate the DB with sample data?
  seedDB: false,

  // Secret for session, you will want to change this and make it an environment variable
  secrets: {
    session: 'latoo-secret'
  },

  // List of user roles
  userRoles: ['guest', 'user', 'admin'],

  // MongoDB connection options
  mongo: {
    options: {
      db: {
        safe: true
      }
    }
  },

  facebook: {
    clientID:     351295398692944,
    clientSecret: "91613bf863e0e3fbdd7af555e7c84e5f",
    callbackURL:  hosts.apiUri+'/auth/facebook/callback'
  },

  twitter: {
    clientID:     'HN6TWn8rFwL3IDzJWHitZ0feU',
    clientSecret: 'hX4U1AaIUaBnvsAM3sY9vIl3zQDv66VG8ZMOO5jTpxLfQKH0M4',
    callbackURL:  hosts.apiUri+'/auth/twitter/callback'
  },

  google: {
    clientID:     '627525026701-j8597kt2phml1ekdgjplbcss35pqeti2.apps.googleusercontent.com',
    clientSecret: '65g6w8UUN1yOOEswfwMZLaWG',
    callbackURL:  hosts.apiUri+'/auth/google/callback'
  }
};

// Export the config object based on the NODE_ENV
// ==============================================
module.exports = _.merge(
  all,
  require('./' + process.env.NODE_ENV + '.js') || {});
