var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;

exports.setup = function (User, config) {
  passport.use(new FacebookStrategy({
      clientID: config.facebook.clientID,
      clientSecret: config.facebook.clientSecret,
      callbackURL: config.facebook.callbackURL
    },
    function(accessToken, refreshToken, profile, done) {
      User.findOne({
        'facebook.id': profile.id
      },
      function(err, user) {
        if (err) {
          return done(err);
        }
        if (!user) {
          user = new User({
            firstName: profile.displayName,
            email: profile.emails && profile.emails[0].value,
            role: 'particulier',
            username: profile.username,
            provider: 'facebook',
            facebook: profile._json
          });
          try{
            user.save(function(err) {
              if (err) return done(err);
              done(err, user);
            });
          }catch(e){
            console.log(e);
          }
        } else {
          return done(err, user);
        }
      })
    }
  ));
};
