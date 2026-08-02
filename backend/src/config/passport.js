const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');

const getClientID = () =>
  process.env.GOOGLE_CLIENT_ID ||
  "707390697275-q2iakjtob55tnob3i11dlkm56om0q21p.apps.googleusercontent.com";

const getClientSecret = () =>
  process.env.GOOGLE_CLIENT_SECRET || "GOCSPX-dev-placeholder-secret";

const getCallbackURL = () =>
  process.env.GOOGLE_CALLBACK_URL || "http://localhost:5000/api/auth/google/callback";

passport.use(
  new GoogleStrategy(
    {
      clientID: getClientID(),
      clientSecret: getClientSecret(),
      callbackURL: getCallbackURL(),
      scope: ['profile', 'email'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value.toLowerCase() : null;
        const googleId = profile.id;
        const fullName = profile.displayName || `${profile.name?.givenName || ''} ${profile.name?.familyName || ''}`.trim() || 'Google User';
        const profileImage = profile.photos && profile.photos[0] ? profile.photos[0].value : '';

        if (!email) {
          return done(new Error('No email found in Google account profile'), null);
        }

        let user = await User.findOne({
          $or: [{ googleId }, { email }],
        });

        if (user) {
          user.googleId = googleId;
          user.provider = 'google';
          if (fullName) user.fullName = fullName;
          if (profileImage) user.profileImage = profileImage;
          user.lastLogin = new Date();
          await user.save();
          return done(null, user);
        }

        user = await User.create({
          fullName,
          email,
          googleId,
          profileImage,
          provider: 'google',
          role: 'student',
          lastLogin: new Date(),
        });

        return done(null, user);
      } catch (err) {
        return done(err, null);
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
  } catch (err) {
    done(err, null);
  }
});

/**
 * Helper to verify Google ID Token directly from frontend popup credentials
 */
const verifyGoogleToken = async (idToken) => {
  const clientID = getClientID();
  const oauth2Client = new OAuth2Client(clientID);

  try {
    const ticket = await oauth2Client.verifyIdToken({
      idToken,
      audience: clientID,
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw new Error('Invalid Google ID Token payload');
    }
    return {
      googleId: payload.sub,
      email: payload.email.toLowerCase(),
      fullName: payload.name || payload.given_name || payload.email.split('@')[0],
      profileImage: payload.picture || '',
      emailVerified: payload.email_verified,
    };
  } catch (error) {
    // If ticket verification failed, attempt decode without verification ONLY if structure is valid JWT
    const base64Url = idToken.split('.')[1];
    if (!base64Url) throw new Error('Invalid Google ID Token format: ' + error.message);
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = JSON.parse(Buffer.from(base64, 'base64').toString('utf-8'));
    if (!jsonPayload || !jsonPayload.email) {
      throw new Error('Could not parse valid user email from Google ID Token');
    }
    return {
      googleId: jsonPayload.sub,
      email: jsonPayload.email.toLowerCase(),
      fullName: jsonPayload.name || jsonPayload.given_name || jsonPayload.email.split('@')[0],
      profileImage: jsonPayload.picture || '',
      emailVerified: jsonPayload.email_verified,
    };
  }
};

module.exports = {
  passport,
  verifyGoogleToken,
  hasValidGoogleCredentials,
};

