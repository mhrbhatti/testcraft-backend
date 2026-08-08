const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { generatePaper } = require('../engine/generator');
const Paper = require('../models/Paper');

// POST /api/generate — auto generate
router.post('/', async (req, res) => {
  try {
    const { testType, chapters, difficulty, subject, classLevel, testNo } = req.body;
    if (!testType || !chapters?.length || !subject)
      return res.status(400).json({ success: false, error: 'testType, chapters, and subject are required.' });

    const snapshot = await generatePaper({ testType, chapters, difficulty: difficulty || 'any', subject, classLevel: classLevel || '9', testNo });

    const paper = await Paper.create({
      title: `${subject} — ${snapshot.schema.name} #${testNo || 1}`,
      subject, classLevel: classLevel || '9', testType, chapters,
      difficulty, totalMarks: snapshot.totalMarks,
      testNo, time: snapshot.time, snapshot,
    });

    res.status(201).json({ success: true, data: { paperId: paper._id, ...snapshot } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/generate/papers
router.get('/papers', async (req, res) => {
  try {
    const papers = await Paper.find().select('-snapshot').sort({ createdAt: -1 });
    res.json({ success: true, data: papers });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/generate/papers/:id
router.get('/papers/:id', async (req, res) => {
  try {
    const paper = await Paper.findById(req.params.id);
    if (!paper) return res.status(404).json({ success: false, error: 'Paper not found' });
    res.json({ success: true, data: paper });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/generate/papers/:id
router.delete('/papers/:id', async (req, res) => {
  try {
    await Paper.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/generate/manual — custom / board pattern
router.post('/manual', async (req, res) => {
  try {
    const { testType, questionIds, subject, classLevel, testNo, time, totalMarks, schema } = req.body;

    console.log('Manual received IDs:', questionIds.length, questionIds);

    const Question = require('../models/Question');
    const mongoose = require('mongoose');

    const objectIds = questionIds.map(id => new mongoose.Types.ObjectId(id.toString()));
    const allQuestions = await Question.find({ _id: { $in: objectIds } }).lean();

    console.log('Found:', allQuestions.length);
    console.log('Types:', allQuestions.map(q => q.type));

    // Preserve the ORDER from questionIds so types split correctly
    const qMap = {};
    allQuestions.forEach(q => { qMap[q._id.toString()] = q; });

    const ordered = questionIds.map(id => qMap[id.toString()]).filter(Boolean);

    const mcqs   = ordered.filter(q => q.type === 'mcq');
    const shorts = ordered.filter(q => q.type === 'short');
    const longs  = ordered.filter(q => q.type === 'long');

    console.log(`Split — MCQ:${mcqs.length} Short:${shorts.length} Long:${longs.length}`);

    function buildFLPGroups(shortsArr, sch) {
      const shortSchema = sch.sections.find(s => s.type === 'short');
      if (!shortSchema?.groups) return [];
      const perGroup = shortSchema.questionsPerGroup;
      return Array.from({ length: shortSchema.groups }, (_, i) => ({
        questions: shortsArr.slice(i * perGroup, (i + 1) * perGroup),
        attempt: shortSchema.attemptPerGroup,
      }));
    }

    // MCQ-only schema
    const mcqOnlySchema = {
      name: 'MCQ Test',
      totalMarks: mcqs.length,
      time: '30 mins',
      sections: [{ type: 'mcq', count: mcqs.length, marksEach: 1 }],
    };

    const usedSchema = testType === 'mcq-only' ? mcqOnlySchema : schema;

    const snapshot = {
      testType,
      schema: usedSchema,
      subject,
      classLevel,
      testNo: testNo || '1',
      time: time || usedSchema.time,
      totalMarks: totalMarks || usedSchema.totalMarks,
      chapters: [...new Set(allQuestions.map(q => q.chapter))],
      difficulty: 'mixed',
      sections: {
        mcqs,
        shorts:      testType === 'flp' ? undefined : (shorts.length ? shorts : undefined),
        shortGroups: testType === 'flp' ? buildFLPGroups(shorts, usedSchema) : undefined,
        longs:       longs.length ? longs : undefined,
        longsAttempt: testType === 'flp'
          ? usedSchema.sections.find(s => s.type === 'long')?.attempt
          : undefined,
      },
    };

    const paper = await Paper.create({
      title: `${subject} — ${usedSchema.name} #${testNo || 1} (Custom)`,
      subject, classLevel: classLevel || '9', testType,
      chapters: snapshot.chapters, difficulty: 'mixed',
      totalMarks: snapshot.totalMarks, testNo, time: snapshot.time,
      snapshot,
    });

    res.status(201).json({ success: true, data: { paperId: paper._id, ...snapshot } });
  } catch (err) {
    console.error('Manual build error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
