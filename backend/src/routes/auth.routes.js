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

// GET /auth/google - Initiate Google OAuth redirect flow
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// GET /auth/google/callback - Google OAuth redirect callback
router.get('/google/callback', (req, res, next) => {
  passport.authenticate('google', { session: false }, (err, user, info) => {
    if (err || !user) {
      console.error('[Google OAuth Authentication Error]', err || info);
      const errMsg = err?.message || info?.message || 'Google authentication failed';
      return res.redirect(`http://localhost:5173/login?error=${encodeURIComponent(errMsg)}`);
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
