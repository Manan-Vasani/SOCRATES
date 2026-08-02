const express = require('express');
const passport = require('passport');
const {
  googleAuth,
  googleAuthCallback,
  logout,
  getMe,
  registerUser,
  loginUser,
  updateProfile,
} = require('../controllers/authController');
const verifyJWT = require('../middleware/verifyJWT');

const router = express.Router();

const { hasValidGoogleCredentials } = require('../config/passport');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// GET /auth/google - Initiate Google OAuth redirect flow or Dev/Demo Fallback
router.get('/google', async (req, res, next) => {
  if (!hasValidGoogleCredentials()) {
    try {
      let user = await User.findOne({ email: 'alex.mercer@gmail.com' });
      if (!user) {
        user = await User.create({
          fullName: 'Alex Mercer',
          email: 'alex.mercer@gmail.com',
          googleId: 'google-demo-100200300',
          profileImage: 'https://ui-avatars.com/api/?name=Alex+Mercer&background=0066cc&color=fff&size=128&bold=true',
          provider: 'google',
          role: 'student',
          lastLogin: new Date(),
        });
      } else {
        user.lastLogin = new Date();
        await user.save();
      }
      const token = generateToken(user._id);
      const hostOrigin = req.headers.referer ? new URL(req.headers.referer).origin : 'http://localhost:5173';
      const frontendUrl = process.env.FRONTEND_URL || hostOrigin;
      return res.redirect(`${frontendUrl}/dashboard?token=${token}`);
    } catch (err) {
      console.error('[Google Demo Auth Error]', err);
      return res.redirect('http://localhost:5173/login?error=Google+Auth+Failed');
    }
  }

  return passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

// GET /auth/google/callback - Google OAuth redirect callback
router.get('/google/callback', (req, res, next) => {
  passport.authenticate('google', { session: false }, (err, user, info) => {
    const hostOrigin = req.headers.referer ? new URL(req.headers.referer).origin : 'http://localhost:5173';
    const frontendUrl = process.env.FRONTEND_URL || hostOrigin;
    if (err || !user) {
      console.error('[Google OAuth Authentication Error]', err || info);
      const errMsg = err?.message || info?.message || 'Google authentication failed';
      return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(errMsg)}`);
    }
    req.user = user;
    return googleAuthCallback(req, res, next);
  })(req, res, next);
});


// POST /auth/google - Google ID Token authentication from popup credential
router.post('/google', googleAuth);

// POST /auth/logout - Logout user
router.post('/logout', logout);

// GET /auth/me - Protected route to get user profile
router.get('/me', verifyJWT, getMe);

// POST /auth/signup & POST /auth/login for local auth
router.post('/signup', registerUser);
router.post('/register', registerUser);
router.post('/login', loginUser);
router.put('/profile', verifyJWT, updateProfile);

module.exports = router;
