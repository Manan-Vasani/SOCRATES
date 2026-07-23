const User = require('../models/User');
const generateToken = require('../utils/generateToken');

/**
 * @desc    Register a new user (Sign Up)
 * @route   POST /api/v1/auth/signup
 * @access  Public
 */
const registerUser = async (req, res) => {
  const { name, email, password, role, bio, subjects } = req.body;

  // Check if email already exists
  const userExists = await User.findOne({ email });

  if (userExists) {
    return res.status(400).json({
      success: false,
      message: 'User already exists with this email address',
    });
  }

  // Create new user
  const user = await User.create({
    name,
    email,
    password,
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
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio,
        subjects: user.subjects,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
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
  const user = await User.findOne({ email }).select('+password');

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
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      bio: user.bio,
      subjects: user.subjects,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
    },
  });
};

/**
 * @desc    Get currently logged in user profile
 * @route   GET /api/v1/auth/me
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
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      bio: user.bio,
      subjects: user.subjects,
      hourlyRate: user.hourlyRate,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
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

  user.name = req.body.name || user.name;
  user.bio = req.body.bio !== undefined ? req.body.bio : user.bio;
  user.avatar = req.body.avatar || user.avatar;
  user.subjects = req.body.subjects || user.subjects;

  if (req.body.password) {
    user.password = req.body.password;
  }

  const updatedUser = await user.save();

  return res.json({
    success: true,
    message: 'Profile updated successfully',
    user: {
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      avatar: updatedUser.avatar,
      bio: updatedUser.bio,
      subjects: updatedUser.subjects,
      isVerified: updatedUser.isVerified,
      createdAt: updatedUser.createdAt,
    },
  });
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
};
