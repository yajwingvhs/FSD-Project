const path = require('path');
const dns = require('dns');
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const cors = require('cors');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const authRoutes = require('./routes/auth');
const skillRoutes = require('./routes/skills');
const requestRoutes = require('./routes/requests');

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// 1. Middleware setup
app.use(
  cors({
    origin: [CLIENT_URL, 'http://127.0.0.1:5173', 'http://localhost:5174'],
    credentials: true, // Allow session cookies from the React frontend
  })
);
app.use(express.json());
app.use(cookieParser());
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

// Simple custom request logger middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// 2. MongoDB Atlas connection (public DNS enables mongodb+srv:// on Windows)
dns.setServers(['8.8.8.8', '1.1.1.1']);
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI || MONGO_URI.includes('<db_password>')) {
  console.warn(
    'WARNING: MONGO_URI is missing or still contains <db_password>. Update backend/.env with your MongoDB Atlas password.'
  );
} else {
  mongoose
    .connect(MONGO_URI, { dbName: 'skillswap' })
    .then(() => console.log('Connected to MongoDB Atlas (Database: skillswap)'))
    .catch((err) => console.error('MongoDB connection error:', err.message));
}

// 3. Health check and API routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

app.use('/api', authRoutes);
app.use('/api', skillRoutes);
app.use('/api', requestRoutes);

// 4. Start server
app.listen(PORT, () => {
  console.log(`SkillSwap backend running on http://localhost:${PORT}`);
});
