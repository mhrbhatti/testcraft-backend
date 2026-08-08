const express = require('express');
const router  = express.Router();
const Result  = require('../models/Result');
const User    = require('../models/User');

// GET /api/admin/results
router.get('/results', async (req, res) => {
  try {
    const results = await Result.find().sort({ createdAt: -1 }).select('-answers');
    res.json({ success: true, data: results });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/admin/students
router.get('/students', async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).select('-password').sort({ createdAt: -1 });
    res.json({ success: true, data: students });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
