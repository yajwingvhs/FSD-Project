const express = require('express');
const mongoose = require('mongoose');
const { Skill } = require('../models');
const { requireAuth, ensureDbConnected } = require('../middleware');

const router = express.Router();

// POST /api/skills - Add a new skill
router.post('/skills', requireAuth, async (req, res) => {
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
router.get('/skills', async (req, res) => {
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
router.get('/skills/:id', async (req, res) => {
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
router.put('/skills/:id', requireAuth, async (req, res) => {
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
router.delete('/skills/:id', requireAuth, async (req, res) => {
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

module.exports = router;

