const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { googleAuth, googleAuthCallback, logout, getMe } = require('./auth.controller');

/**
 * @desc    Register a new user (Sign Up)
 * @route   POST /api/v1/auth/signup
 * @access  Public
 */
const registerUser = async (req, res) => {
  const { name, fullName, email, password, role, bio, subjects } = req.body;

  const userFullName = fullName || name;

  if (!userFullName || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide full name, email, and password',
    });
  }

  // Check if email already exists
  const userExists = await User.findOne({ email: email.toLowerCase() });

  if (userExists) {
    return res.status(400).json({
      success: false,
      message: 'User already exists with this email address',
    });
  }

  // Create new user
  const user = await User.create({
    fullName: userFullName,
    email: email.toLowerCase(),
    password,
    provider: 'local',
    role: role || 'student',
    bio: bio || '',
    subjects: subjects || [],
  });

  if (user) {
    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
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
        bio: user.bio,
        subjects: user.subjects,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } else {
    return res.status(400).json({
      success: false,
      message: 'Invalid user data provided',
    });
  }
};

/**
 * @desc    Authenticate user & get token (Log In)
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide both email and password',
    });
  }

  // Find user by email and include password field
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password',
    });
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password',
    });
  }

  const token = generateToken(user._id);

  return res.json({
    success: true,
    message: 'User logged in successfully',
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
      bio: user.bio,
      subjects: user.subjects,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  });
};

/**
 * @desc    Update user profile
 * @route   PUT /api/v1/auth/profile
 * @access  Private
 */
const updateProfile = async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  if (req.body.fullName || req.body.name) {
    user.fullName = req.body.fullName || req.body.name;
  }
  if (req.body.phone !== undefined) user.phone = req.body.phone;
  if (req.body.role && ['student', 'tutor', 'both'].includes(req.body.role)) {
    user.role = req.body.role;
  }
  if (req.body.bio !== undefined) user.bio = req.body.bio;
  if (req.body.hourlyRate !== undefined) user.hourlyRate = Number(req.body.hourlyRate);
  if (req.body.rate20Min !== undefined) user.rate20Min = Number(req.body.rate20Min);
  if (req.body.rate30Min !== undefined) user.rate30Min = Number(req.body.rate30Min);
  if (req.body.profileImage || req.body.avatar !== undefined) {
    user.profileImage = req.body.profileImage || req.body.avatar;
  }
  if (req.body.subjects) user.subjects = req.body.subjects;
  if (req.body.availability !== undefined) user.availability = req.body.availability;

  if (req.body.password) {
    user.password = req.body.password;
  }

  const updatedUser = await user.save();

  return res.json({
    success: true,
    message: 'Profile updated successfully',
    user: {
      _id: updatedUser._id,
      fullName: updatedUser.fullName,
      name: updatedUser.fullName,
      email: updatedUser.email,
      phone: updatedUser.phone,
      googleId: updatedUser.googleId,
      profileImage: updatedUser.profileImage,
      avatar: updatedUser.profileImage,
      provider: updatedUser.provider,
      role: updatedUser.role,
      bio: updatedUser.bio,
      subjects: updatedUser.subjects,
      hourlyRate: updatedUser.hourlyRate,
      rate20Min: updatedUser.rate20Min,
      rate30Min: updatedUser.rate30Min,
      availability: updatedUser.availability,
      isVerified: updatedUser.isVerified,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    },
  });
};

/**
 * @desc    Send password reset OTP via Brevo
 * @route   POST /api/v1/auth/forgot-password
 * @access  Public
 */
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid email address',
    });
  }

  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    return res.status(200).json({
      success: true,
      message: 'If an account exists with this email, a 6-digit OTP code has been sent.',
    });
  }

  // Generate 6-digit OTP and crypto token
  const crypto = require('crypto');
  const sendEmail = require('../utils/sendEmail');

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const resetToken = crypto.randomBytes(32).toString('hex');
  const expireTime = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

  user.resetPasswordOtp = otp;
  user.resetPasswordToken = resetToken;
  user.resetPasswordExpire = expireTime;
  await user.save({ validateBeforeSave: false });

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(user.email)}`;

  // Send Brevo email
  await sendEmail({
    to: user.email,
    userName: user.fullName || user.name,
    subject: 'SOCRATES — Password Reset Verification Code',
    otp,
    resetUrl,
  });

  return res.json({
    success: true,
    message: 'Verification OTP sent to your email address!',
  });
};

/**
 * @desc    Verify OTP code
 * @route   POST /api/v1/auth/verify-otp
 * @access  Public
 */
const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({
      success: false,
      message: 'Please provide both email and 6-digit OTP code',
    });
  }

  const user = await User.findOne({
    email: email.toLowerCase(),
    resetPasswordOtp: otp,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired verification code.',
    });
  }

  return res.json({
    success: true,
    message: 'OTP verified successfully',
    resetToken: user.resetPasswordToken,
  });
};

/**
 * @desc    Reset User Password
 * @route   POST /api/v1/auth/reset-password
 * @access  Public
 */
const resetPassword = async (req, res) => {
  const { email, otp, resetToken, newPassword, password } = req.body;
  const targetPassword = newPassword || password;

  if (!targetPassword || targetPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters long',
    });
  }

  let user = null;

  if (email && otp) {
    user = await User.findOne({
      email: email.toLowerCase(),
      resetPasswordOtp: otp,
      resetPasswordExpire: { $gt: Date.now() },
    });
  }

  if (!user && resetToken) {
    user = await User.findOne({
      resetPasswordToken: resetToken,
      resetPasswordExpire: { $gt: Date.now() },
    });
  }

  if (!user && email) {
    user = await User.findOne({
      email: email.toLowerCase(),
      resetPasswordExpire: { $gt: Date.now() },
    });
  }

  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired password reset session. Please request a new code.',
    });
  }

  // Update password and clear reset fields
  user.password = targetPassword;
  user.resetPasswordOtp = null;
  user.resetPasswordToken = null;
  user.resetPasswordExpire = null;

  await user.save();

  return res.json({
    success: true,
    message: 'Password has been reset successfully! Redirecting to Sign In...',
  });
};

module.exports = {
  registerUser,
  loginUser,
  googleAuth,
  googleAuthCallback,
  logout,
  getMe,
  updateProfile,
  forgotPassword,
  verifyOTP,
  resetPassword,
};


