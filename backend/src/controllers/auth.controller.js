const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { verifyGoogleToken } = require('../config/passport');

/**
 * @desc    Authenticate with Google via ID Token (Popup flow)
 * @route   POST /auth/google & POST /api/v1/auth/google
 * @access  Public
 */
const googleAuth = async (req, res) => {
  try {
    const { credential, idToken } = req.body;
    const tokenToVerify = credential || idToken;

    if (!tokenToVerify) {
      return res.status(400).json({
        success: false,
        message: 'Google ID Token or credential is required',
      });
    }

    // Verify token with Google
    const googleUser = await verifyGoogleToken(tokenToVerify);

    const { googleId, email, fullName, profileImage } = googleUser;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Could not retrieve email from Google Account',
      });
    }

    // Find existing user by googleId or email
    let user = await User.findOne({
      $or: [{ googleId }, { email: email.toLowerCase() }],
    });

    if (user) {
      // User exists -> Update Google credentials, profile image, and last login
      user.googleId = googleId;
      user.provider = 'google';
      if (fullName) user.fullName = fullName;
      if (profileImage) user.profileImage = profileImage;
      user.lastLogin = new Date();
      await user.save();
    } else {
      // User does not exist -> Automatically register user
      user = await User.create({
        fullName: fullName || email.split('@')[0],
        email: email.toLowerCase(),
        googleId,
        profileImage: profileImage || '',
        provider: 'google',
        role: 'student',
        lastLogin: new Date(),
      });
    }

    // Generate JWT token
    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      message: 'Google authentication successful',
      token,
      user: {
        _id: user._id,
        fullName: user.fullName,
        name: user.fullName,
        email: user.email,
        googleId: user.googleId,
        profileImage: user.profileImage,
        avatar: user.profileImage,
        provider: user.provider,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error('[Google Auth Controller Error]', error);
    return res.status(500).json({
      success: false,
      message: 'Google authentication failed: ' + error.message,
    });
  }
};

/**
 * @desc    Passport Google OAuth Callback
 * @route   GET /auth/google/callback
 * @access  Public
 */
const googleAuthCallback = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Google authentication failed',
      });
    }

    const token = generateToken(req.user._id);

    // Return HTML script to post token to parent window or redirect to frontend dashboard
    const htmlResponse = `
      <!DOCTYPE html>
      <html>
        <head><title>Authentication Successful</title></head>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({
                type: 'GOOGLE_AUTH_SUCCESS',
                token: '${token}',
                user: ${JSON.stringify(req.user)}
              }, '*');
              window.close();
            } else {
              window.location.href = 'http://localhost:5173/dashboard?token=${token}';
            }
          </script>
          <p>Authentication successful. Redirecting to Dashboard...</p>
        </body>
      </html>
    `;
    res.setHeader('Content-Type', 'text/html');
    return res.send(htmlResponse);
  } catch (error) {
    console.error('[Google Callback Error]', error);
    return res.status(500).json({ success: false, message: 'Google callback failed' });
  }
};


/**
 * @desc    Logout User
 * @route   POST /auth/logout & POST /api/v1/auth/logout
 * @access  Public / Private
 */
const logout = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'User logged out successfully',
  });
};

/**
 * @desc    Get currently logged in user profile
 * @route   GET /auth/me & GET /api/v1/auth/me
 * @access  Private
 */
const getMe = async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  return res.json({
    success: true,
    user: {
      _id: user._id,
      fullName: user.fullName,
      name: user.fullName,
      email: user.email,
      googleId: user.googleId,
      profileImage: user.profileImage,
      avatar: user.profileImage,
      provider: user.provider,
      role: user.role,
      bio: user.bio,
      subjects: user.subjects,
      hourlyRate: user.hourlyRate,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLogin: user.lastLogin,
    },
  });
};

module.exports = {
  googleAuth,
  googleAuthCallback,
  logout,
  getMe,
};
