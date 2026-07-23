const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
require('dotenv').config();

const connectDB = require('./config/db');
const homepageRoutes = require('./routes/homepageRoutes');
const aiRoutes = require('./routes/aiRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect Database
connectDB();

// Security & Performance Middlewares
app.use(helmet());
app.use(compression());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/homepage', homepageRoutes);
app.use('/api/v1/ai', aiRoutes);

// Healthcheck Route
app.get('/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'SOCRATES Backend API',
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

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[SOCRATES Backend Error] Port ${PORT} is already in use by another process.`);
    console.error(`[Fix] Close the existing node process running on port ${PORT} or change process.env.PORT.`);
  } else {
    console.error('[SOCRATES Backend Error]', err);
  }
});
