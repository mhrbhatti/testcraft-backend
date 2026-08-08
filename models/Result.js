const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  student:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentName:{ type: String },
  classLevel: { type: String },
  subject:    { type: String },
  chapter:    { type: String },
  totalQ:     { type: Number },
  correct:    { type: Number },
  wrong:      { type: Number },
  skipped:    { type: Number },
  score:      { type: Number }, // percentage
  xpEarned:  { type: Number, default: 0 },
  timeTaken:  { type: Number }, // seconds
  answers: [{
    questionId:   { type: mongoose.Schema.Types.ObjectId },
    questionText: { type: String },
    options:      [String],
    correctAnswer:{ type: String },
    studentAnswer:{ type: String },
    isCorrect:    { type: Boolean },
  }],
}, { timestamps: true });

module.exports = mongoose.model('Result', resultSchema);
