import dotenv from 'dotenv';
dotenv.config();

import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      passReqToCallback: true 
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const selectedRole = req.query.state || 'customer'; 
        
        let user = await User.findOne({ email: profile.emails[0].value });

        if (user) {
          // STRICT CHECK: If user registered via Email/Password (local), BLOCK Google Login
          if (user.authProvider === 'local') {
            return done(null, false, { message: 'Please login with your email and password' });
          }

          // If user is already Google, update ID and role based on current selection
          user.googleId = profile.id;
          user.role = selectedRole;
          await user.save();
          return done(null, user);
        }

        // Create new Google User
        user = await User.create({
          googleId: profile.id,
          name: profile.displayName,
          email: profile.emails[0].value,
          avatar: profile.photos[0]?.value,
          authProvider: 'google', // Explicitly set provider
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