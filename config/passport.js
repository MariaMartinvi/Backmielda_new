const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

// This would normally come from your User model
const users = [
  {
    id: '1',
    email: 'test@example.com',
    password: 'password123', // In a real app, this should be hashed
    name: 'Test User'
  }
];

// JWT strategy for token authentication
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET || 'your-secret-key-for-development' // Always use environment variables in production
};

passport.use(new JwtStrategy(jwtOptions, (jwt_payload, done) => {
  // In a real app, you would find the user in your database
  const user = users.find(u => u.id === jwt_payload.sub);
  
  if (user) {
    return done(null, user);
  } else {
    return done(null, false);
  }
}));

// Local strategy for username/password authentication
passport.use(new LocalStrategy(
  { usernameField: 'email' },
  (email, password, done) => {
    // Find user with provided email
    const user = users.find(u => u.email === email);
    
    if (!user) {
      return done(null, false, { message: 'User not found' });
    }
    
    // Check password (in a real app, would compare hashed passwords)
    if (user.password !== password) {
      return done(null, false, { message: 'Incorrect password' });
    }
    
    return done(null, user);
  }
));

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.NODE_ENV === 'production'
      ? 'https://generadorcuentos.onrender.com/api/auth/google/callback'
      : 'http://localhost:5001/api/auth/google/callback'
  },
  async function(accessToken, refreshToken, profile, done) {
    try {
      // Check if user already exists
      let user = await User.findOne({ googleId: profile.id });
      
      if (!user) {
        // Create new user if doesn't exist
        user = await User.create({
          googleId: profile.id,
          email: profile.emails[0].value,
          name: profile.displayName,
          avatar: profile.photos[0].value
        });
      }
      
      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }
));

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

module.exports = passport; 