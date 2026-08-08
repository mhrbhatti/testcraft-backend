const express  = require('express');
const router   = express.Router();
const jwt      = require('jsonwebtoken');
const Question = require('../models/Question');
const Result   = require('../models/Result');
const User     = require('../models/User');

const SECRET = 'testcraft_secret_2025';

function auth(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    req.user = jwt.verify(token, SECRET);
    next();
  } catch { res.status(401).json({ error: 'Invalid token' }); }
}

// GET /api/student/subjects
router.get('/subjects', auth, async (req, res) => {
  try {
    const subjects = await Question.distinct('subject');
    res.json({ success: true, data: subjects });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/student/chapters?subject=X
router.get('/chapters', auth, async (req, res) => {
  try {
    const { subject } = req.query;
    const chapters = await Question.distinct('chapter', { subject, type: 'mcq' });
    res.json({ success: true, data: chapters });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/student/quiz?subject=X&chapter=Y&count=10
router.get('/quiz', auth, async (req, res) => {
  try {
    const { subject, chapter, count = 10 } = req.query;
    const questions = await Question.aggregate([
      { $match: { subject, chapter, type: 'mcq' } },
      { $sample: { size: Number(count) } },
      { $project: { questionText: 1, options: 1, correctAnswer: 1 } },
    ]);
    if (questions.length < Number(count)) {
      return res.status(400).json({ error: `Only ${questions.length} MCQs available in this chapter. Try a lower count.` });
    }
    res.json({ success: true, data: questions });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/student/submit
router.post('/submit', auth, async (req, res) => {
  try {
    const { subject, chapter, answers, timeTaken } = req.body;
    // answers = [{ questionId, questionText, options, correctAnswer, studentAnswer }]

    let correct = 0, wrong = 0, skipped = 0;
    const processed = answers.map(a => {
      const isCorrect = a.studentAnswer && a.studentAnswer === a.correctAnswer;
      if (!a.studentAnswer) skipped++;
      else if (isCorrect) correct++;
      else wrong++;
      return { ...a, isCorrect: !!isCorrect };
    });

    const totalQ = answers.length;
    const score  = Math.round((correct / totalQ) * 100);
    const xpEarned = correct * 10 + (score === 100 ? 50 : 0); // bonus for perfect

    // Update user XP, streak, badges
    const user = await User.findById(req.user.id);
    user.xp += xpEarned;

    // Streak logic
    const now  = new Date();
    const last = user.lastActive ? new Date(user.lastActive) : null;
    const sameDay = last && last.toDateString() === now.toDateString();
    const yesterday = last && (now - last) < 48 * 3600 * 1000;
    if (!sameDay) {
      user.streak = yesterday ? user.streak + 1 : 1;
      user.lastActive = now;
    }

    // Badge logic
    const newBadges = [];
    if (!user.badges.includes('first_quiz')) { newBadges.push('first_quiz'); }
    if (score === 100 && !user.badges.includes('perfect_score')) newBadges.push('perfect_score');
    if (user.streak >= 7  && !user.badges.includes('week_streak'))  newBadges.push('week_streak');
    if (user.streak >= 30 && !user.badges.includes('month_streak')) newBadges.push('month_streak');
    if (user.xp  >= 500  && !user.badges.includes('xp_500'))  newBadges.push('xp_500');
    if (user.xp  >= 1000 && !user.badges.includes('xp_1000')) newBadges.push('xp_1000');
    user.badges.push(...newBadges);
    await user.save();

    const result = await Result.create({
      student: req.user.id,
      studentName: user.name,
      classLevel:  user.classLevel,
      subject, chapter,
      totalQ, correct, wrong, skipped, score,
      xpEarned, timeTaken,
      answers: processed,
    });

    res.json({
      success: true,
      data: {
        score, correct, wrong, skipped, totalQ, xpEarned,
        newBadges,
        user: { xp: user.xp, streak: user.streak, badges: user.badges },
        answers: processed,
        resultId: result._id,
      },
    });
  } catch (err) {
    console.error('Submit error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/student/history — student's own results
router.get('/history', auth, async (req, res) => {
  try {
    const results = await Result.find({ student: req.user.id }).sort({ createdAt: -1 }).select('-answers');
    res.json({ success: true, data: results });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
