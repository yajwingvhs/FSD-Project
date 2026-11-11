const mongoose = require('mongoose');

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

const User = mongoose.model('User', userSchema);
const Skill = mongoose.model('Skill', skillSchema);
const Request = mongoose.model('Request', requestSchema);

module.exports = { User, Skill, Request };

