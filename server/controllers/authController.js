
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET =
  process.env.JWT_SECRET || 'sustainable_secret_key_12345';

// Generate JWT token
const generateToken = (id, email, name) => {
  return jwt.sign({ id, email, name }, JWT_SECRET, {
    expiresIn: '30d'
  });
};

// Register a new user
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (
      typeof name !== 'string' ||
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      !name.trim() ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        error: 'Please provide name, email, and password'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'An account with this email already exists'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword
    });

    const token = generateToken(
      user._id,
      user.email,
      user.name
    );

    return res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        token
      }
    });
  } catch (error) {
    console.error('Registration error:', error.message);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email already exists'
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Server error during user registration'
    });
  }
};

// Login an existing user
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        error: 'Please provide email and password'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail
    });

    console.log('Login email:', normalizedEmail);
    console.log('User found:', Boolean(user));

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    console.log('Password matches:', isMatch);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    const token = generateToken(
      user._id,
      user.email,
      user.name
    );

    return res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error.message);

    return res.status(500).json({
      success: false,
      error: 'Server error during user login'
    });
  }
};

// Get the current user's profile
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get profile error:', error.message);

    return res.status(500).json({
      success: false,
      error: 'Server error fetching user profile'
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe
};
