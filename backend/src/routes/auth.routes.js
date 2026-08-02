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
  forgotPassword,
  verifyOTP,
  resetPassword,
} = require('../controllers/authController');
const verifyJWT = require('../middleware/verifyJWT');

const router = express.Router();

const { hasValidGoogleCredentials } = require('../config/passport');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// GET /auth/google - Initiate Google OAuth redirect flow (Forces Google Account Chooser screen)
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account',
  })
);

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

// Password Reset Routes (Brevo Integration)
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOTP);
router.post('/reset-password', resetPassword);

module.exports = router;
