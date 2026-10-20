
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

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

    if (!user.password) {
      return res.status(400).json({
        success: false,
        error: 'This account was registered using Google Sign-In. Please sign in with Google.'
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

// Google OAuth Token Verification & Login / Register
const googleAuth = async (req, res) => {
  try {
    const idToken = req.body?.token || req.body?.idToken || req.body?.credential;

    if (!idToken || typeof idToken !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Google ID token is required'
      });
    }

    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    if (!googleClientId) {
      console.error('Missing GOOGLE_CLIENT_ID environment variable');
      return res.status(500).json({
        success: false,
        error: 'Google authentication is not configured on the server. Please set GOOGLE_CLIENT_ID.'
      });
    }

    const client = new OAuth2Client(googleClientId);

    let ticket;
    try {
      ticket = await client.verifyIdToken({
        idToken,
        audience: googleClientId
      });
    } catch (verifyError) {
      console.error('Google token verification error:', verifyError.message);
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired Google token'
      });
    }

    const payload = ticket.getPayload();
    if (!payload || !payload.sub) {
      return res.status(401).json({
        success: false,
        error: 'Invalid Google token payload'
      });
    }

    const googleSub = payload.sub;
    const email = payload.email ? payload.email.trim().toLowerCase() : null;
    const name = payload.name ? payload.name.trim() : (email ? email.split('@')[0] : 'Google User');

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Google account does not provide an email address'
      });
    }

    if (payload.email_verified !== true) {
      return res.status(400).json({
        success: false,
        error: 'Google account email address is not verified.'
      });
    }

    // 1. Check if user already exists with this Google sub
    let user = await User.findOne({ googleId: googleSub });

    if (user) {
      const token = generateToken(user._id, user.email, user.name);
      return res.status(200).json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          token
        }
      });
    }

    // 2. Check if an account already exists with this email (e.g. registered with password)
    const existingEmailUser = await User.findOne({ email });

    if (existingEmailUser) {
      // Do not silently link or overwrite existing email/password account
      return res.status(409).json({
        success: false,
        error: 'An account with this email already exists using password authentication. Please log in with your email and password.'
      });
    }

    // 3. Create a new Google-authenticated user
    user = await User.create({
      name,
      email,
      googleId: googleSub
    });

    const token = generateToken(user._id, user.email, user.name);

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
    console.error('Google authentication error:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Server error during Google authentication'
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  googleAuth
};
