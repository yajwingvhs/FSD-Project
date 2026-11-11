const express = require('express');
const mongoose = require('mongoose');
const { User, Skill, Request } = require('../models');
const { requireAuth, ensureDbConnected } = require('../middleware');

const router = express.Router();

// GET /api/dashboard - Use MongoDB Aggregation for dashboard statistics
router.get('/dashboard', requireAuth, async (req, res) => {
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

// POST /api/requests - Send a skill exchange request
router.post('/requests', requireAuth, async (req, res) => {
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
router.get('/requests', requireAuth, async (req, res) => {
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
router.put('/requests/:id', requireAuth, async (req, res) => {
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

module.exports = router;

