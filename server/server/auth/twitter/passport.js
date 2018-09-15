exports.setup = function (User, config) {
  var passport = require('passport');
  var TwitterStrategy = require('passport-twitter').Strategy;

  passport.use(new TwitterStrategy({
    consumerKey: config.twitter.clientID,
    consumerSecret: config.twitter.clientSecret,
    callbackURL: config.twitter.callbackURL
  },
  function(token, tokenSecret, profile, done) {
    
    User.findOne({
      'twitter.id_str': profile.id
    }, function(err, user) {
      if (err) {
        return done(err);
      }
      if (!user) {
        user = new User({
          firstName: profile.displayName,
          username: profile.username,
          role: 'particulier',
          provider: 'twitter',
          twitter: profile._json
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
    });
    }
  ));
};
