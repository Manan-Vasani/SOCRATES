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
  if (req.body.bio !== undefined) user.bio = req.body.bio;
  if (req.body.profileImage || req.body.avatar) {
    user.profileImage = req.body.profileImage || req.body.avatar;
  }
  if (req.body.subjects) user.subjects = req.body.subjects;

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
      googleId: updatedUser.googleId,
      profileImage: updatedUser.profileImage,
      avatar: updatedUser.profileImage,
      provider: updatedUser.provider,
      role: updatedUser.role,
      bio: updatedUser.bio,
      subjects: updatedUser.subjects,
      isVerified: updatedUser.isVerified,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    },
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
};

