const express = require('express');
const mongoose = require('mongoose');
app.use(cors({
  origin: '*',
  credentials: true,
}));

const questionsRouter = require('./routes/questions');
const generateRouter  = require('./routes/generate');
const exportRouter    = require('./routes/export');
const boardRouter     = require('./routes/board');
const authRouter      = require('./routes/auth');
const studentRouter   = require('./routes/student');
const adminRouter     = require('./routes/admin');

const app = express();
const MONGO_URI = process.env.MONGODB_URI || 'mongodb+srv://CodexCS:11221122@cluster0.someqyg.mongodb.net/TestCraft?retryWrites=true&w=majority';
app.use(cors());
const PORT = process.env.PORT || 5000;
app.use(express.json());

app.use('/api/questions', questionsRouter);
app.use('/api/generate',  generateRouter);
app.use('/api/export',    exportRouter);
app.use('/api/board',     boardRouter);
app.use('/api/auth',      authRouter);
app.use('/api/student',   studentRouter);
app.use('/api/admin',     adminRouter);

app.get('/', (req, res) => res.json({ status: 'TestCraft API running' }));

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
  })
  .catch((err) => console.error('❌ MongoDB connection error:', err));
