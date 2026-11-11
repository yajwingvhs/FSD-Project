const mongoose = require('mongoose');

// Protect private routes by checking the session userId
function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ message: 'Unauthorized. Please login first.' });
  }
  next();
}

// Ensure MongoDB Atlas is connected before running database queries
function ensureDbConnected(res) {
  if (mongoose.connection.readyState !== 1) {
    res.status(503).json({
      message: 'Database not connected. Check your MongoDB Atlas password in backend/.env.',
    });
    return false;
  }
  return true;
}

module.exports = { requireAuth, ensureDbConnected };

