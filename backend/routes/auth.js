const express = require('express');
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { requireAuth, ensureDbConnected } = require('../middleware');

const router = express.Router();

// POST /api/register - Register a new student
router.post('/register', async (req, res) => {
  if (!ensureDbConnected(res)) return;

  try {
    const { name, email, password, department, college } = req.body;

    if (!name || !email || !password || !department || !college) {
      return res.status(400).json({ message: 'All registration fields are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists.' });
    }

    // Hash password securely using bcryptjs
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      department,
      college,
    });

    res.status(201).json({
      message: 'Registration successful! Please login.',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        department: user.department,
        college: user.college,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Registration failed.', error: error.message });
  }
});

// POST /api/login - Authenticate student & start session
router.post('/login', async (req, res) => {
  if (!ensureDbConnected(res)) return;

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Store user ID in express-session
    req.session.userId = user._id.toString();

    // Set a helper cookie readable by cookie-parser
    res.cookie('skillswap_user', user.name, {
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: 'lax',
    });

    res.json({
      message: 'Login successful!',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        department: user.department,
        college: user.college,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Login failed.', error: error.message });
  }
});

// POST /api/logout - Destroy session and clear cookies
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Could not log out.' });
    }
    res.clearCookie('connect.sid');
    res.clearCookie('skillswap_user');
    res.json({ message: 'Logged out successfully.' });
  });
});

// GET /api/me - Check current logged-in session
router.get('/me', async (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.json({ user: null });
  }
  if (!ensureDbConnected(res)) return;

  try {
    const user = await User.findById(req.session.userId).select('-password');
    if (!user) {
      return res.json({ user: null });
    }
    res.json({ user, cookieName: req.cookies.skillswap_user || null });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load current user.', error: error.message });
  }
});

// GET /api/profile - Fetch logged-in student's profile
router.get('/profile', requireAuth, async (req, res) => {
  if (!ensureDbConnected(res)) return;

  try {
    const user = await User.findById(req.session.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load profile.', error: error.message });
  }
});

// PUT /api/profile - Update logged-in student's profile
router.put('/profile', requireAuth, async (req, res) => {
  if (!ensureDbConnected(res)) return;

  try {
    const { name, email, department, college } = req.body;

    if (!name || !email || !department || !college) {
      return res.status(400).json({ message: 'Name, email, department, and college are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingWithEmail = await User.findOne({
      email: normalizedEmail,
      _id: { $ne: req.session.userId },
    });

    if (existingWithEmail) {
      return res.status(400).json({ message: 'That email is already used by another account.' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.session.userId,
      {
        name: name.trim(),
        email: normalizedEmail,
        department: department.trim(),
        college: college.trim(),
      },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.cookie('skillswap_user', updatedUser.name, {
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: 'lax',
    });

    res.json({ message: 'Profile updated successfully!', user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update profile.', error: error.message });
  }
});

module.exports = router;

