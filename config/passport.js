const { authenticate } = require('./db');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const User = require('../models/User');


const initializePassport = (passport) => {

  // change default username field to email
  passport.use( new LocalStrategy( { usernameField: 'email' }, 
    async (email, password, done) => {
      try {
        const user = await User.findOne({ where: { email }, raw: true });
        if (!user) { return done(null, false, { message: 'Invalid user/email'}) };

        // Verify password
        try {
          if (await bcrypt.compare(password, user.password)) {
            return done(null, user)
          } else {
            return done(null, false, { message: 'Password incorrect'})
          }
        } catch (err) {
          return done(err)
        }
      } catch (err) {
        console.log(err);
      }
    }
  ))

  // serialize user to the session
  passport.serializeUser(async (user, done) => await done(null, user.id));

  // deserialize user by id
  passport.deserializeUser( async (id, done) => {
    try {
      const user = await User.findByPk(id, {raw: true});
      return user ? done(null, user) : done({err: 'User not found'}, null)
    } catch (err) {
      console.log(err);
    }    
  });
};

module.exports = initializePassport;