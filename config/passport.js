import dotenv from 'dotenv';
// 1. Initialize dotenv immediately, before using process.env
dotenv.config();

import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';

// In config/passport.js
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID, // Now this will work
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      passReqToCallback: true 
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        // Note: Ensure your initial auth request included specific 'state' params
        // for this to work. Otherwise, it defaults to 'customer'.
        const selectedRole = req.query.state || 'customer'; 
        
        let user = await User.findOne({ email: profile.emails[0].value });

        if (user) {
          user.googleId = profile.id;
          user.role = selectedRole; 
          await user.save();
          return done(null, user);
        }

        user = await User.create({
          googleId: profile.id,
          name: profile.displayName,
          email: profile.emails[0].value,
          avatar: profile.photos[0]?.value,
          authProvider: 'google',
          role: selectedRole,
          isEmailVerified: true
        });

        done(null, user);
      } catch (error) {
        done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;