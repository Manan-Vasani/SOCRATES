const express = require('express');
const router = express.Router();
const {
  askTutor,
  recommendTutors,
  summarizeSession,
  checkAIHealth,
} = require('../controllers/aiController');

// AI Microservice Gateway Routes
router.get('/health', checkAIHealth);
router.post('/tutor/query', askTutor);
router.post('/recommend/tutors', recommendTutors);
router.post('/summarize/session', summarizeSession);

module.exports = router;
