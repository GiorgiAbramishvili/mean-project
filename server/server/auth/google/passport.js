var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var config = require('../../config/environment');
exports.setup = function (User, config) {
  passport.use(new GoogleStrategy({
      clientID: config.google.clientID,
      clientSecret: config.google.clientSecret,
      callbackURL: config.google.callbackURL
    },
    function(request, accessToken, refreshToken, profile, done) {
      
      User.findOne({
        'google.id': profile.id
      }, function(err, user) {
        if (!user) {
          user = new User({
            firstName: profile.name.givenName,
            email: profile.emails[0].value,
            role: 'particulier',
            username: profile.displayName,
            provider: 'google',
            google: profile._json
          });
         

            user.save(function(err) {
     if (err)  return done('The specified email address is already in use.');

              done(err, user);
            });
          
      
        
        } else {
          return done(err, user);
        }
      });
    }
  ));
};
