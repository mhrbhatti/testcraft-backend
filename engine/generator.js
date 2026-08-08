const Question = require('../models/Question');
const TEST_SCHEMAS = require('./schemas');

/**
 * Randomly sample `size` items from an array (Fisher-Yates).
 */
function sample(arr, size) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, size);
}

/**
 * Fetch random questions from MongoDB matching given criteria.
 */
async function fetchRandom({ type, chapters, difficulty, count, excludeIds = [] }) {
  const match = {
    type,
    chapter: { $in: chapters },
    _id: { $nin: excludeIds },
  };
  if (difficulty && difficulty !== 'any') match.difficulty = difficulty;

  const questions = await Question.aggregate([
    { $match: match },
    { $sample: { size: count * 3 } }, // over-fetch then slice for true randomness
  ]);

  return sample(questions, count);
}

/**
 * Main generator — given options, returns a full paper object.
 *
 * @param {object} opts
 * @param {string} opts.testType   - 'class-test' | 'revision-test' | 'flp'
 * @param {string[]} opts.chapters - chapters to draw from
 * @param {string} opts.difficulty - 'easy' | 'medium' | 'hard' | 'any'
 * @param {string} opts.subject
 * @param {string} opts.classLevel
 * @param {string} opts.testNo
 * @returns {object} paper snapshot
 */
async function generatePaper(opts) {
  const { testType, chapters, difficulty, subject, classLevel, testNo } = opts;
  const schema = TEST_SCHEMAS[testType];
  if (!schema) throw new Error(`Unknown test type: ${testType}`);

  const usedIds = [];
  const result = {
    testType,
    schema,
    subject,
    classLevel,
    testNo: testNo || '1',
    time: schema.time,
    totalMarks: schema.totalMarks,
    chapters,
    difficulty,
    sections: {},
  };

  for (const section of schema.sections) {
    const { type } = section;

    if (type === 'mcq') {
      const qs = await fetchRandom({ type: 'mcq', chapters, difficulty, count: section.count, excludeIds: usedIds });
      if (qs.length < section.count) {
        throw new Error(`Not enough MCQs in the question bank. Need ${section.count}, found ${qs.length}. Add more questions.`);
      }
      qs.forEach(q => usedIds.push(q._id));
      result.sections.mcqs = qs;
    }

    if (type === 'short') {
      // FLP: groups of questions
      if (section.groups) {
        const groups = [];
        for (let g = 0; g < section.groups; g++) {
          const qs = await fetchRandom({
            type: 'short',
            chapters,
            difficulty,
            count: section.questionsPerGroup,
            excludeIds: usedIds,
          });
          if (qs.length < section.questionsPerGroup) {
            throw new Error(`Not enough short questions for group ${g + 1}. Need ${section.questionsPerGroup}, found ${qs.length}.`);
          }
          qs.forEach(q => usedIds.push(q._id));
          groups.push({ questions: qs, attempt: section.attemptPerGroup });
        }
        result.sections.shortGroups = groups;
      } else {
        // Normal (class-test / revision-test)
        const qs = await fetchRandom({ type: 'short', chapters, difficulty, count: section.count, excludeIds: usedIds });
        if (qs.length < section.count) {
          throw new Error(`Not enough short questions. Need ${section.count}, found ${qs.length}.`);
        }
        qs.forEach(q => usedIds.push(q._id));
        result.sections.shorts = qs;
      }
    }

    if (type === 'long') {
      const count = section.count || section.totalQuestions;
      const qs = await fetchRandom({ type: 'long', chapters, difficulty, count, excludeIds: usedIds });
      if (qs.length < count) {
        throw new Error(`Not enough long questions. Need ${count}, found ${qs.length}.`);
      }
      qs.forEach(q => usedIds.push(q._id));
      result.sections.longs = qs;
      if (section.attempt) result.sections.longsAttempt = section.attempt;
    }
  }

  return result;
}

module.exports = { generatePaper };
