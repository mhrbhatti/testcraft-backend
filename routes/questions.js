const express = require('express');
const router = express.Router();
const Question = require('../models/Question');

// GET all questions (with optional filters)
router.get('/', async (req, res) => {
  try {
    const { subject, chapter, type, difficulty, classLevel, search } = req.query;
    const filter = {};
    if (subject)    filter.subject    = subject;
    if (chapter)    filter.chapter    = chapter;
    if (type)       filter.type       = type;
    if (difficulty) filter.difficulty = difficulty;
    if (classLevel) filter.classLevel = classLevel;
    if (search)     filter.questionText = { $regex: search, $options: 'i' };

    const questions = await Question.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, count: questions.length, data: questions });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET distinct chapters for a subject
router.get('/chapters', async (req, res) => {
  try {
    const { subject } = req.query;
    const filter = subject ? { subject } : {};
    const chapters = await Question.distinct('chapter', filter);
    res.json({ success: true, data: chapters.sort() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET distinct subjects
router.get('/subjects', async (req, res) => {
  try {
    const subjects = await Question.distinct('subject');
    res.json({ success: true, data: subjects.sort() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET single question
router.get('/:id', async (req, res) => {
  try {
    const q = await Question.findById(req.params.id);
    if (!q) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: q });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST — create one question
router.post('/', async (req, res) => {
  try {
    const q = await Question.create(req.body);
    res.status(201).json({ success: true, data: q });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// POST — bulk create questions
router.post('/bulk', async (req, res) => {
  try {
    const { questions } = req.body;
    if (!Array.isArray(questions)) return res.status(400).json({ success: false, error: 'questions must be an array' });
    const result = await Question.insertMany(questions, { ordered: false });
    res.status(201).json({ success: true, count: result.length, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// PUT — update a question
router.put('/:id', async (req, res) => {
  try {
    const q = await Question.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!q) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: q });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// DELETE — remove a question
router.delete('/:id', async (req, res) => {
  try {
    const q = await Question.findByIdAndDelete(req.params.id);
    if (!q) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET stats for dashboard
router.get('/stats/overview', async (req, res) => {
  try {
    const [total, mcqs, shorts, longs, byChapter] = await Promise.all([
      Question.countDocuments(),
      Question.countDocuments({ type: 'mcq' }),
      Question.countDocuments({ type: 'short' }),
      Question.countDocuments({ type: 'long' }),
      Question.aggregate([
        { $group: { _id: '$chapter', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);
    res.json({ success: true, data: { total, mcqs, shorts, longs, byChapter } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
