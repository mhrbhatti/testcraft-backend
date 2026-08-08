const mongoose = require('mongoose');

const paperSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    subject: { type: String, required: true },
    classLevel: { type: String, required: true },
    testType: {
      type: String,
      enum: ['class-test', 'revision-test', 'flp', 'mcq-only', 'board'],
      required: true,
    },
    chapters: [String],
    difficulty: String,
    totalMarks: Number,
    testNo: String,
    time: String,
    sections: {
      mcqs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
      shorts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
      longs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
    },
    // Full snapshot of questions at time of generation (so export always works)
    snapshot: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Paper', paperSchema);
