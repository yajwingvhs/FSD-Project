const path = require('path');
const dns = require('dns');
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const cors = require('cors');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// ==========================================
// 1. EXPRESS MIDDLEWARE SETUP
// ==========================================
app.use(
  cors({
    origin: [CLIENT_URL, 'http://127.0.0.1:5173', 'http://localhost:5174'],
    credentials: true, // Allow session cookies from the React frontend
  })
);
app.use(express.json());
app.use(cookieParser());

// Configure cookie-based sessions using express-session
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'skillswap_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    },
  })
);

// Simple custom logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Custom authentication middleware to protect private routes
function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ message: 'Unauthorized. Please login first.' });
  }
  next();
}

// ==========================================
// 2. MONGODB ATLAS CONNECTION
// ==========================================
// Use Google/Cloudflare DNS so mongodb+srv:// SRV lookups succeed on Windows networks
dns.setServers(['8.8.8.8', '1.1.1.1']);

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI || MONGO_URI.includes('<db_password>')) {
  console.warn(
    'WARNING: MONGO_URI is missing or still contains <db_password>. Update backend/.env with your MongoDB Atlas password.'
  );
}

if (MONGO_URI && !MONGO_URI.includes('<db_password>')) {
  mongoose
    .connect(MONGO_URI, { dbName: 'skillswap' })
    .then(() => {
      console.log('Connected to MongoDB Atlas (Database: skillswap)');
    })
    .catch((err) => {
      console.error('MongoDB connection error:', err.message);
    });
}

// ==========================================
// 3. MONGOOSE SCHEMAS & MODELS
// ==========================================

// User Schema
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    department: { type: String, required: true, trim: true },
    college: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);

// Skill Schema
const skillSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    skillName: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    experienceLevel: {
      type: String,
      required: true,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
    },
  },
  { timestamps: true }
);

const Skill = mongoose.model('Skill', skillSchema);

// Exchange Request Schema
const requestSchema = new mongoose.Schema(
  {
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    offeredSkill: { type: String, required: true, trim: true },
    requestedSkill: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['Pending', 'Accepted', 'Rejected'],
      default: 'Pending',
    },
  },
  { timestamps: true }
);

const Request = mongoose.model('Request', requestSchema);

// Helper to ensure database is connected before handling queries
function ensureDbConnected(res) {
  if (mongoose.connection.readyState !== 1) {
    res.status(503).json({
      message: 'Database not connected. Check your MongoDB Atlas password in backend/.env.',
    });
    return false;
  }
  return true;
}

// ==========================================
// 4. HEALTH CHECK ROUTE
// ==========================================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// ==========================================
// 5. AUTHENTICATION ROUTES
// ==========================================

// POST /api/register - Register a new student
app.post('/api/register', async (req, res) => {
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
app.post('/api/login', async (req, res) => {
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
app.post('/api/logout', (req, res) => {
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
app.get('/api/me', async (req, res) => {
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

// ==========================================
// 6. DASHBOARD AGGREGATION ROUTE
// ==========================================

// GET /api/dashboard - Use MongoDB Aggregation for dashboard statistics
app.get('/api/dashboard', requireAuth, async (req, res) => {
  if (!ensureDbConnected(res)) return;

  try {
    const userObjectId = new mongoose.Types.ObjectId(req.session.userId);

    // Aggregate count of skills offered by this student
    const skillStats = await Skill.aggregate([
      { $match: { userId: userObjectId } },
      { $count: 'totalSkills' },
    ]);

    // Aggregate exchange requests grouped by status (Pending, Accepted, Rejected)
    const requestStats = await Request.aggregate([
      {
        $match: {
          $or: [{ senderId: userObjectId }, { receiverId: userObjectId }],
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    let pendingRequests = 0;
    let acceptedRequests = 0;
    let rejectedRequests = 0;

    requestStats.forEach((item) => {
      if (item._id === 'Pending') pendingRequests = item.count;
      if (item._id === 'Accepted') acceptedRequests = item.count;
      if (item._id === 'Rejected') rejectedRequests = item.count;
    });

    const totalSkills = skillStats.length > 0 ? skillStats[0].totalSkills : 0;
    const totalRequests = pendingRequests + acceptedRequests + rejectedRequests;

    res.json({
      totalSkills,
      totalRequests,
      acceptedRequests,
      pendingRequests,
      rejectedRequests,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load dashboard stats.', error: error.message });
  }
});

// ==========================================
// 7. SKILL CRUD ROUTES
// ==========================================

// POST /api/skills - Add a new skill
app.post('/api/skills', requireAuth, async (req, res) => {
  if (!ensureDbConnected(res)) return;

  try {
    const { skillName, category, description, experienceLevel } = req.body;

    if (!skillName || !category || !description || !experienceLevel) {
      return res.status(400).json({ message: 'All skill fields are required.' });
    }

    const newSkill = await Skill.create({
      userId: req.session.userId,
      skillName,
      category,
      description,
      experienceLevel,
    });

    const populatedSkill = await Skill.findById(newSkill._id).populate(
      'userId',
      'name department college'
    );

    res.status(201).json({
      message: 'Skill added successfully!',
      skill: populatedSkill,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to add skill.', error: error.message });
  }
});

// GET /api/skills - List, search, filter, sort, and limit skills
app.get('/api/skills', async (req, res) => {
  if (!ensureDbConnected(res)) return;

  try {
    const { search, category, sort, limit, mine } = req.query;
    const filter = {};

    // Filter to only logged-in user's skills when mine=true
    if (mine === 'true') {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: 'Please login to view your skills.' });
      }
      filter.userId = req.session.userId;
    }

    // Category filter
    if (category && category !== 'All') {
      filter.category = category;
    }

    // Search query across skillName, category, and description
    if (search && search.trim() !== '') {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [{ skillName: regex }, { category: regex }, { description: regex }];
    }

    // Sorting options
    let sortOption = { createdAt: -1 };
    if (sort === 'az') sortOption = { skillName: 1 };
    if (sort === 'za') sortOption = { skillName: -1 };

    let query = Skill.find(filter)
      .populate('userId', 'name department college')
      .sort(sortOption);

    // Optional record limit (e.g., for Featured Skills on Home page)
    if (limit && !Number.isNaN(Number(limit))) {
      query = query.limit(Number(limit));
    }

    const skills = await query;
    res.json({ skills });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch skills.', error: error.message });
  }
});

// GET /api/skills/:id - Get a single skill by route parameter
app.get('/api/skills/:id', async (req, res) => {
  if (!ensureDbConnected(res)) return;

  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid skill ID.' });
    }

    const skill = await Skill.findById(req.params.id).populate(
      'userId',
      'name department college'
    );

    if (!skill) {
      return res.status(404).json({ message: 'Skill not found.' });
    }

    res.json({ skill });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch skill.', error: error.message });
  }
});

// PUT /api/skills/:id - Update a skill (owner only)
app.put('/api/skills/:id', requireAuth, async (req, res) => {
  if (!ensureDbConnected(res)) return;

  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid skill ID.' });
    }

    const skill = await Skill.findById(req.params.id);
    if (!skill) {
      return res.status(404).json({ message: 'Skill not found.' });
    }

    if (skill.userId.toString() !== req.session.userId) {
      return res.status(403).json({ message: 'You can only edit your own skills.' });
    }

    const { skillName, category, description, experienceLevel } = req.body;
    if (!skillName || !category || !description || !experienceLevel) {
      return res.status(400).json({ message: 'All skill fields are required.' });
    }

    skill.skillName = skillName;
    skill.category = category;
    skill.description = description;
    skill.experienceLevel = experienceLevel;

    await skill.save();

    const updatedSkill = await Skill.findById(skill._id).populate(
      'userId',
      'name department college'
    );

    res.json({ message: 'Skill updated successfully!', skill: updatedSkill });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update skill.', error: error.message });
  }
});

// DELETE /api/skills/:id - Delete a skill (owner only)
app.delete('/api/skills/:id', requireAuth, async (req, res) => {
  if (!ensureDbConnected(res)) return;

  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid skill ID.' });
    }

    const skill = await Skill.findById(req.params.id);
    if (!skill) {
      return res.status(404).json({ message: 'Skill not found.' });
    }

    if (skill.userId.toString() !== req.session.userId) {
      return res.status(403).json({ message: 'You can only delete your own skills.' });
    }

    await Skill.findByIdAndDelete(req.params.id);
    res.json({ message: 'Skill deleted successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete skill.', error: error.message });
  }
});

// ==========================================
// 8. EXCHANGE REQUEST ROUTES
// ==========================================

// POST /api/requests - Send a skill exchange request
app.post('/api/requests', requireAuth, async (req, res) => {
  if (!ensureDbConnected(res)) return;

  try {
    const { receiverId, offeredSkill, requestedSkill } = req.body;

    if (!receiverId || !offeredSkill || !requestedSkill) {
      return res.status(400).json({ message: 'Receiver and both skills are required.' });
    }

    if (!mongoose.Types.ObjectId.isValid(receiverId)) {
      return res.status(400).json({ message: 'Invalid receiver ID.' });
    }

    if (receiverId === req.session.userId) {
      return res.status(400).json({ message: 'You cannot send a skill request to yourself.' });
    }

    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: 'Recipient student not found.' });
    }

    const existingPending = await Request.findOne({
      senderId: req.session.userId,
      receiverId,
      offeredSkill: offeredSkill.trim(),
      requestedSkill: requestedSkill.trim(),
      status: 'Pending',
    });

    if (existingPending) {
      return res.status(400).json({ message: 'A pending request for this exchange already exists.' });
    }

    const newRequest = await Request.create({
      senderId: req.session.userId,
      receiverId,
      offeredSkill,
      requestedSkill,
      status: 'Pending',
    });

    const populatedRequest = await Request.findById(newRequest._id)
      .populate('senderId', 'name email department college')
      .populate('receiverId', 'name email department college');

    res.status(201).json({
      message: 'Skill exchange request sent!',
      request: populatedRequest,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to send request.', error: error.message });
  }
});

// GET /api/requests - Get sent and received requests for logged-in student
app.get('/api/requests', requireAuth, async (req, res) => {
  if (!ensureDbConnected(res)) return;

  try {
    const { type, status } = req.query;
    const filter = {};

    if (type === 'sent') {
      filter.senderId = req.session.userId;
    } else if (type === 'received') {
      filter.receiverId = req.session.userId;
    } else {
      filter.$or = [
        { senderId: req.session.userId },
        { receiverId: req.session.userId },
      ];
    }

    if (status && ['Pending', 'Accepted', 'Rejected'].includes(status)) {
      filter.status = status;
    }

    const requests = await Request.find(filter)
      .populate('senderId', 'name email department college')
      .populate('receiverId', 'name email department college')
      .sort({ createdAt: -1 });

    res.json({ requests });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch requests.', error: error.message });
  }
});

// PUT /api/requests/:id - Accept or reject an incoming request (receiver only)
app.put('/api/requests/:id', requireAuth, async (req, res) => {
  if (!ensureDbConnected(res)) return;

  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid request ID.' });
    }

    const { status } = req.body;
    if (!['Accepted', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be Accepted or Rejected.' });
    }

    const exchangeRequest = await Request.findById(req.params.id);
    if (!exchangeRequest) {
      return res.status(404).json({ message: 'Exchange request not found.' });
    }

    if (exchangeRequest.receiverId.toString() !== req.session.userId) {
      return res.status(403).json({ message: 'Only the recipient can respond to this request.' });
    }

    exchangeRequest.status = status;
    await exchangeRequest.save();

    const updatedRequest = await Request.findById(exchangeRequest._id)
      .populate('senderId', 'name email department college')
      .populate('receiverId', 'name email department college');

    res.json({
      message: `Request ${status.toLowerCase()} successfully!`,
      request: updatedRequest,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update request.', error: error.message });
  }
});

// ==========================================
// 9. PROFILE ROUTES
// ==========================================

// GET /api/profile - Fetch logged-in student's profile
app.get('/api/profile', requireAuth, async (req, res) => {
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
app.put('/api/profile', requireAuth, async (req, res) => {
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

// ==========================================
// 10. START SERVER
// ==========================================
app.listen(PORT, () => {
  console.log(`SkillSwap backend running on http://localhost:${PORT}`);
});
