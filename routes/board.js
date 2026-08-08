const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Question = require('../models/Question');
const Paper = require('../models/Paper');

function sample(arr, size) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, size);
}

// POST /api/board/generate
router.post('/generate', async (req, res) => {
  try {
    const { subject, classLevel, testNo, pairing, difficulty } = req.body;
    // pairing = [ { chapter, mcqCount, shortGroup, longSlot } ]

    const usedIds = [];
    const mcqs   = [];
    const shorts  = []; // flat list, we'll group later
    const longs   = [];

    // Track which short group each question belongs to
    const shortGroupMap = {}; // groupNo -> questions[]

    for (const row of pairing) {
      const { chapter, mcqCount, shortGroup, longSlot } = row;
      const matchBase = { subject, chapter };
      if (difficulty && difficulty !== 'any') matchBase.difficulty = difficulty;

      // MCQs
      if (mcqCount > 0) {
        const found = await Question.aggregate([
          { $match: { ...matchBase, type: 'mcq', _id: { $nin: usedIds } } },
          { $sample: { size: mcqCount * 2 } },
        ]);
        const picked = sample(found, mcqCount);
        if (picked.length < mcqCount) {
          return res.status(400).json({ success: false, error: `Not enough MCQs in chapter "${chapter}". Need ${mcqCount}, found ${picked.length}.` });
        }
        picked.forEach(q => { mcqs.push(q); usedIds.push(q._id); });
      }

      // Short questions
      if (shortGroup > 0) {
        const found = await Question.aggregate([
          { $match: { ...matchBase, type: 'short', _id: { $nin: usedIds } } },
          { $sample: { size: 6 } },
        ]);
        const picked = sample(found, Math.min(found.length, 3)); // pick up to 3 per chapter per group
        if (picked.length === 0) {
          return res.status(400).json({ success: false, error: `No short questions found in chapter "${chapter}".` });
        }
        picked.forEach(q => { usedIds.push(q._id); });
        if (!shortGroupMap[shortGroup]) shortGroupMap[shortGroup] = [];
        shortGroupMap[shortGroup].push(...picked);
      }

      // Long questions
      if (longSlot > 0) {
        const found = await Question.aggregate([
          { $match: { ...matchBase, type: 'long', _id: { $nin: usedIds } } },
          { $sample: { size: 3 } },
        ]);
        const picked = sample(found, 1);
        if (picked.length === 0) {
          return res.status(400).json({ success: false, error: `No long questions found in chapter "${chapter}".` });
        }
        picked.forEach(q => { longs.push(q); usedIds.push(q._id); });
      }
    }

    // Build short groups array sorted by group number
    const shortGroups = Object.keys(shortGroupMap)
      .sort((a, b) => Number(a) - Number(b))
      .map(gNo => ({
        questions: shortGroupMap[gNo],
        attempt: Math.max(1, shortGroupMap[gNo].length - 2),
      }));

    // Build schema
    const totalMCQ   = mcqs.length;
    const totalShort = Object.values(shortGroupMap).reduce((s, g) => s + g.length, 0);
    const totalLong  = longs.length;
    const totalMarks = totalMCQ * 1 + totalShort * 2 + totalLong * 8;

    const schema = {
      name: 'Board Pattern',
      totalMarks,
      time: '3 Hours',
      sections: [
        totalMCQ   > 0 ? { type: 'mcq',   count: totalMCQ,   marksEach: 1 } : null,
        totalShort > 0 ? { type: 'short',  groups: shortGroups.length, questionsPerGroup: Math.ceil(totalShort / shortGroups.length), attemptPerGroup: Math.max(1, Math.ceil(totalShort / shortGroups.length) - 2), marksEach: 2, totalQuestionsNeeded: totalShort } : null,
        totalLong  > 0 ? { type: 'long',   totalQuestions: totalLong, attempt: totalLong, marksEach: 8 } : null,
      ].filter(Boolean),
    };

    const snapshot = {
      testType: 'flp',
      schema,
      subject,
      classLevel,
      testNo: testNo || '1',
      time: schema.time,
      totalMarks,
      chapters: [...new Set(pairing.map(p => p.chapter))],
      difficulty: difficulty || 'any',
      sections: {
        mcqs,
        shortGroups: shortGroups.length ? shortGroups : undefined,
        longs: longs.length ? longs : undefined,
        longsAttempt: totalLong,
      },
    };

    const paper = await Paper.create({
      title: `${subject} — Board Pattern #${testNo || 1}`,
      subject,
      classLevel: classLevel || '13',
      testType: 'flp',
      chapters: snapshot.chapters,
      difficulty: difficulty || 'any',
      totalMarks,
      testNo,
      time: schema.time,
      snapshot,
    });

    res.status(201).json({ success: true, data: { paperId: paper._id, ...snapshot } });
  } catch (err) {
    console.error('Board generate error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
