const rateLimit = require('express-rate-limit');

/**
 * Global Rate Limiter for all API routes
 * Prevents general scraping and DDoS attacks
 */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again after 15 minutes.',
  },
});

/**
 * Strict Rate Limiter for Auth endpoints (Login, Signup, Forgot Password, OTP Verification)
 * Protects against brute-force credential and OTP guessing
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 auth requests per 15 mins
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
});

/**
 * Rate Limiter for Tutor Bookings
 * Prevents automated double-booking or spam reservations
 */
const bookingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // Limit each IP to 15 booking attempts per 15 mins
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many booking attempts. Please wait a few minutes before trying again.',
  },
});

/**
 * Rate Limiter for AI endpoints (Recommendations, Socratic Auto-Answers)
 * Prevents AI API key quota exhaustion
 */
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 40, // Limit each IP to 40 AI queries per 15 mins
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'AI request limit reached. Please wait a few minutes before asking more questions.',
  },
});

module.exports = {
  globalLimiter,
  authLimiter,
  bookingLimiter,
  aiLimiter,
};
