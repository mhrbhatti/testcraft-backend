/**
 * Seed script — run with: node server/scripts/seed.js
 * Clears existing questions and inserts samples.
 */

const mongoose = require('mongoose');
const Question = require('../models/Question');

const MONGO_URI = 'mongodb://localhost:27017/testcraft';

const questions = [
  // ── Python Basics MCQs ──
  { type: 'mcq', subject: 'Computer Science', chapter: 'Python Basics', classLevel: '9', difficulty: 'easy', marks: 1, questionText: 'Which keyword is used to define a function in Python?', options: ['function', 'define', 'def', 'func'], correctAnswer: 'def' },
  { type: 'mcq', subject: 'Computer Science', chapter: 'Python Basics', classLevel: '9', difficulty: 'easy', marks: 1, questionText: 'What is the output of print(2 ** 3)?', options: ['6', '8', '9', '5'], correctAnswer: '8' },
  { type: 'mcq', subject: 'Computer Science', chapter: 'Python Basics', classLevel: '9', difficulty: 'easy', marks: 1, questionText: 'Which data type is used to store True or False?', options: ['int', 'str', 'bool', 'float'], correctAnswer: 'bool' },
  { type: 'mcq', subject: 'Computer Science', chapter: 'Python Basics', classLevel: '9', difficulty: 'medium', marks: 1, questionText: 'What does the len() function return for a list?', options: ['Sum of elements', 'Number of elements', 'Last element', 'First element'], correctAnswer: 'Number of elements' },
  { type: 'mcq', subject: 'Computer Science', chapter: 'Python Basics', classLevel: '9', difficulty: 'medium', marks: 1, questionText: 'Which of these is a valid Python comment?', options: ['// comment', '/* comment */', '# comment', '<!-- comment -->'], correctAnswer: '# comment' },
  { type: 'mcq', subject: 'Computer Science', chapter: 'Python Basics', classLevel: '9', difficulty: 'medium', marks: 1, questionText: 'What is the index of the first element in a Python list?', options: ['1', '-1', '0', 'None'], correctAnswer: '0' },
  { type: 'mcq', subject: 'Computer Science', chapter: 'Python Basics', classLevel: '9', difficulty: 'hard', marks: 1, questionText: 'What is the result of 10 // 3 in Python?', options: ['3.33', '3', '4', '1'], correctAnswer: '3' },
  { type: 'mcq', subject: 'Computer Science', chapter: 'Python Basics', classLevel: '9', difficulty: 'hard', marks: 1, questionText: 'Which method is used to add an element at the end of a list?', options: ['add()', 'insert()', 'append()', 'push()'], correctAnswer: 'append()' },

  // ── SDLC MCQs ──
  { type: 'mcq', subject: 'Computer Science', chapter: 'SDLC', classLevel: '9', difficulty: 'easy', marks: 1, questionText: 'What does SDLC stand for?', options: ['Software Design Life Cycle', 'System Development Life Cycle', 'Software Development Life Cycle', 'System Design Logic Cycle'], correctAnswer: 'Software Development Life Cycle' },
  { type: 'mcq', subject: 'Computer Science', chapter: 'SDLC', classLevel: '9', difficulty: 'easy', marks: 1, questionText: 'Which phase of SDLC involves gathering user requirements?', options: ['Testing', 'Planning', 'Analysis', 'Maintenance'], correctAnswer: 'Analysis' },
  { type: 'mcq', subject: 'Computer Science', chapter: 'SDLC', classLevel: '9', difficulty: 'medium', marks: 1, questionText: 'The Waterfall model is considered a ________ approach.', options: ['Iterative', 'Incremental', 'Linear sequential', 'Agile'], correctAnswer: 'Linear sequential' },
  { type: 'mcq', subject: 'Computer Science', chapter: 'SDLC', classLevel: '9', difficulty: 'medium', marks: 1, questionText: 'Which SDLC model is best suited for projects with unclear requirements?', options: ['Waterfall', 'Spiral', 'V-Model', 'Agile'], correctAnswer: 'Agile' },
  { type: 'mcq', subject: 'Computer Science', chapter: 'SDLC', classLevel: '9', difficulty: 'hard', marks: 1, questionText: 'What is the primary output of the Design phase in SDLC?', options: ['Test cases', 'Source code', 'System architecture document', 'User manual'], correctAnswer: 'System architecture document' },

  // ── Database MCQs ──
  { type: 'mcq', subject: 'Computer Science', chapter: 'Databases', classLevel: '9', difficulty: 'easy', marks: 1, questionText: 'What does DBMS stand for?', options: ['Data Base Management System', 'Data Backup Management System', 'Digital Base Mapping System', 'None of these'], correctAnswer: 'Data Base Management System' },
  { type: 'mcq', subject: 'Computer Science', chapter: 'Databases', classLevel: '9', difficulty: 'easy', marks: 1, questionText: 'Which SQL command is used to retrieve data from a table?', options: ['INSERT', 'SELECT', 'UPDATE', 'DELETE'], correctAnswer: 'SELECT' },
  { type: 'mcq', subject: 'Computer Science', chapter: 'Databases', classLevel: '9', difficulty: 'medium', marks: 1, questionText: 'A primary key must be:', options: ['Null', 'Duplicate', 'Unique and not null', 'Any value'], correctAnswer: 'Unique and not null' },
  { type: 'mcq', subject: 'Computer Science', chapter: 'Databases', classLevel: '9', difficulty: 'hard', marks: 1, questionText: 'Which normal form eliminates partial dependencies?', options: ['1NF', '2NF', '3NF', 'BCNF'], correctAnswer: '2NF' },

  // ── Python Basics Short Questions ──
  { type: 'short', subject: 'Computer Science', chapter: 'Python Basics', classLevel: '9', difficulty: 'easy', marks: 2, questionText: 'What is a variable in Python? Give an example.' },
  { type: 'short', subject: 'Computer Science', chapter: 'Python Basics', classLevel: '9', difficulty: 'easy', marks: 2, questionText: 'Define a list in Python and write an example of creating a list.' },
  { type: 'short', subject: 'Computer Science', chapter: 'Python Basics', classLevel: '9', difficulty: 'easy', marks: 2, questionText: 'What is the difference between = and == in Python?' },
  { type: 'short', subject: 'Computer Science', chapter: 'Python Basics', classLevel: '9', difficulty: 'medium', marks: 2, questionText: 'Write a Python code snippet to find the largest of three numbers.' },
  { type: 'short', subject: 'Computer Science', chapter: 'Python Basics', classLevel: '9', difficulty: 'medium', marks: 2, questionText: 'What are loops? Differentiate between for loop and while loop.' },
  { type: 'short', subject: 'Computer Science', chapter: 'Python Basics', classLevel: '9', difficulty: 'medium', marks: 2, questionText: 'How do you take input from the user in Python? Write syntax and example.' },
  { type: 'short', subject: 'Computer Science', chapter: 'Python Basics', classLevel: '9', difficulty: 'hard', marks: 2, questionText: 'Write a Python function that takes two numbers and returns their sum.' },
  { type: 'short', subject: 'Computer Science', chapter: 'Python Basics', classLevel: '9', difficulty: 'hard', marks: 2, questionText: 'Explain the concept of recursion with a simple Python example.' },

  // ── SDLC Short Questions ──
  { type: 'short', subject: 'Computer Science', chapter: 'SDLC', classLevel: '9', difficulty: 'easy', marks: 2, questionText: 'List any four phases of the Software Development Life Cycle.' },
  { type: 'short', subject: 'Computer Science', chapter: 'SDLC', classLevel: '9', difficulty: 'easy', marks: 2, questionText: 'What is the purpose of the Testing phase in SDLC?' },
  { type: 'short', subject: 'Computer Science', chapter: 'SDLC', classLevel: '9', difficulty: 'medium', marks: 2, questionText: 'Differentiate between Waterfall and Agile development models.' },
  { type: 'short', subject: 'Computer Science', chapter: 'SDLC', classLevel: '9', difficulty: 'medium', marks: 2, questionText: 'What is a Feasibility Study? Why is it important in software development?' },
  { type: 'short', subject: 'Computer Science', chapter: 'SDLC', classLevel: '9', difficulty: 'hard', marks: 2, questionText: 'Explain the role of a System Analyst in the analysis phase of SDLC.' },
  { type: 'short', subject: 'Computer Science', chapter: 'SDLC', classLevel: '9', difficulty: 'hard', marks: 2, questionText: 'What is iterative development? How does it differ from the Waterfall model?' },

  // ── Database Short Questions ──
  { type: 'short', subject: 'Computer Science', chapter: 'Databases', classLevel: '9', difficulty: 'easy', marks: 2, questionText: 'What is a database? Give two real-world examples.' },
  { type: 'short', subject: 'Computer Science', chapter: 'Databases', classLevel: '9', difficulty: 'easy', marks: 2, questionText: 'Define primary key and foreign key with examples.' },
  { type: 'short', subject: 'Computer Science', chapter: 'Databases', classLevel: '9', difficulty: 'medium', marks: 2, questionText: 'What is SQL? Write a query to select all records from a table called "Students".' },
  { type: 'short', subject: 'Computer Science', chapter: 'Databases', classLevel: '9', difficulty: 'medium', marks: 2, questionText: 'What is data redundancy? How does a DBMS help reduce it?' },
  { type: 'short', subject: 'Computer Science', chapter: 'Databases', classLevel: '9', difficulty: 'hard', marks: 2, questionText: 'Explain the difference between DDL and DML commands in SQL with examples.' },

  // ── Long Questions ──
  { type: 'long', subject: 'Computer Science', chapter: 'Python Basics', classLevel: '9', difficulty: 'medium', marks: 8, questionText: 'Explain the concept of functions in Python. Describe built-in and user-defined functions with syntax and examples. Also explain parameters, arguments, and the return statement.' },
  { type: 'long', subject: 'Computer Science', chapter: 'Python Basics', classLevel: '9', difficulty: 'hard', marks: 8, questionText: 'Write a Python program to implement a simple student marks management system. The program should take names and marks of 5 students, calculate average marks, and display the highest and lowest scoring students.' },
  { type: 'long', subject: 'Computer Science', chapter: 'SDLC', classLevel: '9', difficulty: 'medium', marks: 8, questionText: 'Explain the Waterfall Model of SDLC in detail. Draw its diagram and explain each phase with advantages and disadvantages.' },
  { type: 'long', subject: 'Computer Science', chapter: 'SDLC', classLevel: '9', difficulty: 'hard', marks: 8, questionText: 'Compare and contrast the Waterfall model and the Agile methodology. Which would you recommend for a mobile app startup and why? Support your answer with relevant points.' },
  { type: 'long', subject: 'Computer Science', chapter: 'Databases', classLevel: '9', difficulty: 'medium', marks: 8, questionText: 'Explain the concept of normalization in databases. Describe 1NF, 2NF, and 3NF with examples. Why is normalization important in database design?' },
  { type: 'long', subject: 'Computer Science', chapter: 'Databases', classLevel: '9', difficulty: 'hard', marks: 8, questionText: 'Design a simple relational database for a school management system. Identify the entities, attributes, and relationships. Write SQL queries to create the tables and insert sample data.' },
];

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB');

  await Question.deleteMany({});
  console.log('🗑️  Cleared existing questions');

  const inserted = await Question.insertMany(questions);
  console.log(`✅ Inserted ${inserted.length} questions`);

  console.log('\nBreakdown:');
  const mcqs   = questions.filter(q => q.type === 'mcq').length;
  const shorts = questions.filter(q => q.type === 'short').length;
  const longs  = questions.filter(q => q.type === 'long').length;
  console.log(`  MCQs:   ${mcqs}`);
  console.log(`  Shorts: ${shorts}`);
  console.log(`  Longs:  ${longs}`);

  await mongoose.disconnect();
  console.log('\n🎉 Seed complete! Run: npm run dev');
}

seed().catch(err => { console.error(err); process.exit(1); });
