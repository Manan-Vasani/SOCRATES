const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
require('dotenv').config();
require('express-async-errors');

const connectDB = require('./config/db');
const homepageRoutes = require('./routes/homepageRoutes');
const aiRoutes = require('./routes/aiRoutes');
const authRoutes = require('./routes/authRoutes');
const tutorRoutes = require('./routes/tutorRoutes');
const compileRoutes = require('./routes/compileRoutes');
const communityRoutes = require('./routes/communityRoutes');
const studyRoomRoutes = require('./routes/studyRoomRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const { createSocketServer } = require('./socket/socketServer');

const { passport } = require('./config/passport');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect Database
connectDB();

// Security & Performance Middlewares
app.use(
  helmet({
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
    contentSecurityPolicy: false,
  })
);
app.use(compression());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(morgan('dev'));


// Passport Middleware
app.use(passport.initialize());

// API Routes
app.use('/auth', authRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/homepage', homepageRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/tutors', tutorRoutes);
app.use('/api/v1/compile', compileRoutes);
app.use('/api/v1/community', communityRoutes);
app.use('/api/v1/study-rooms', studyRoomRoutes);
app.use('/api/v1/upload', uploadRoutes);

// Healthcheck Route
app.get('/health', (req, res) => {
  const mongoose = require('mongoose');
  res.json({
    status: 'online',
    service: 'SOCRATES Backend API',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    readyState: mongoose.connection.readyState,
    timestamp: new Date().toISOString(),
  });
});

// Global 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(500).json({ success: false, message: 'Internal Server Error', error: err.message });
});

const server = app.listen(PORT, () => {
  console.log(`[SOCRATES Backend] Server running on http://localhost:${PORT}`);
});

// Initialize Socket.IO and store on Express app for controller access
const io = createSocketServer(server);
app.set('io', io);

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[SOCRATES Backend Error] Port ${PORT} is already in use by another process.`);
    console.error(`[Fix] Close the existing node process running on port ${PORT} or change process.env.PORT.`);
  } else {
    console.error('[SOCRATES Backend Error]', err);
  }
});
