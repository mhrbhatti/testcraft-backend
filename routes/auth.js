const express = require('express');
const router  = express.Router();
const jwt     = require('jsonwebtoken');
const User    = require('../models/User');

const SECRET = 'testcraft_secret_2025';

function makeToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, SECRET, { expiresIn: '30d' });
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, classLevel } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password required.' });
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: 'Email already registered.' });
    const user = await User.create({ name, email, password, classLevel: classLevel || '9', role: 'student' });
    const token = makeToken(user);
    res.status(201).json({ success: true, token, user: { id: user._id, name: user.name, email: user.email, classLevel: user.classLevel, role: user.role, xp: user.xp, streak: user.streak, badges: user.badges } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid email or password.' });
    const ok = await user.comparePassword(password);
    if (!ok) return res.status(400).json({ error: 'Invalid email or password.' });
    const token = makeToken(user);
    res.json({ success: true, token, user: { id: user._id, name: user.name, email: user.email, classLevel: user.classLevel, role: user.role, xp: user.xp, streak: user.streak, badges: user.badges } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me — verify token
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    const decoded = jwt.verify(token, SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true, user });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;
