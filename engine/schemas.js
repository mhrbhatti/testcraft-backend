/**
 * Fixed test schemas — each defines exactly how many of each
 * question type to include and how many marks each carries.
 */

const TEST_SCHEMAS = {
  'class-test': {
    name: 'Class Test',
    totalMarks: 25,
    time: '1 Hour',
    sections: [
      { type: 'mcq',   count: 5,  marksEach: 1 },
      { type: 'short', count: 5,  marksEach: 2 },
      { type: 'long',  count: 1,  marksEach: 8 },
    ],
    presentationMarks: 2,
  },

  'revision-test': {
    name: 'Revision Test',
    totalMarks: 30,
    time: '1.5 Hours',
    sections: [
      { type: 'mcq',   count: 8,  marksEach: 1 },
      { type: 'short', count: 7,  marksEach: 2 },
      { type: 'long',  count: 1,  marksEach: 8 },
    ],
  },

  'flp': {
    name: 'FLP',
    totalMarks: 50,
    time: '2 Hours',
    sections: [
      { type: 'mcq',         count: 10, marksEach: 1 },
      // For FLP shorts: 3 groups of 6, attempt 4 each
      {
        type: 'short',
        groups: 3,
        questionsPerGroup: 6,
        attemptPerGroup: 4,
        marksEach: 2,
        totalQuestionsNeeded: 18, // 3 groups × 6
      },
      // For FLP longs: 3 questions, attempt 2
      {
        type: 'long',
        totalQuestions: 3,
        attempt: 2,
        marksEach: 8,
      },
    ],
  },
};

module.exports = TEST_SCHEMAS;
