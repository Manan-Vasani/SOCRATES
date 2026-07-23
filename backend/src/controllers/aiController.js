const axios = require('axios');

const FASTAPI_SERVICE_URL = process.env.FASTAPI_SERVICE_URL || 'http://localhost:8000';

/**
 * Proxy Controller forwarding AI requests from Express Gateway to FastAPI Microservice
 */
const proxyToFastAPI = async (req, res, endpointPath) => {
  try {
    const response = await axios({
      method: req.method,
      url: `${FASTAPI_SERVICE_URL}${endpointPath}`,
      data: req.body,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
    return res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    return res.status(503).json({
      success: false,
      message: 'AI Microservice is currently unreachable',
      error: error.message,
    });
  }
};

// @desc    Forward AI Tutor Query
// @route   POST /api/v1/ai/tutor/query
const askTutor = async (req, res) => {
  await proxyToFastAPI(req, res, '/api/v1/ai/tutor/query');
};

// @desc    Forward Smart Recommendation Match
// @route   POST /api/v1/ai/recommend/tutors
const recommendTutors = async (req, res) => {
  await proxyToFastAPI(req, res, '/api/v1/ai/recommend/tutors');
};

// @desc    Forward Session Summarization
// @route   POST /api/v1/ai/summarize/session
const summarizeSession = async (req, res) => {
  await proxyToFastAPI(req, res, '/api/v1/ai/summarize/session');
};

// @desc    Check FastAPI Service Health
// @route   GET /api/v1/ai/health
const checkAIHealth = async (req, res) => {
  await proxyToFastAPI(req, res, '/health');
};

module.exports = {
  askTutor,
  recommendTutors,
  summarizeSession,
  checkAIHealth,
};
