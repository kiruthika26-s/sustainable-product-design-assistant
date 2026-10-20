const jwt = require('jsonwebtoken');

// Protect route - required authentication
const protect = (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this resource. Token missing.'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'sustainable_secret_key_12345');
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'Token authorization failed. Invalid or expired token.'
    });
  }
};

// Optional auth - attaches user if valid token exists, otherwise proceeds as guest
const optionalAuth = (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'sustainable_secret_key_12345');
      req.user = decoded;
    } catch (e) {
      // Ignore invalid token for optional auth
    }
  }

  next();
};

module.exports = { protect, optionalAuth };
