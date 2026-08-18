const express = require('express');
const router = express.Router();
const tutorController = require('../controllers/tutorController');
const { bookingLimiter } = require('../middleware/rateLimiter');
const { protect } = require('../middleware/authMiddleware');

// Tutor catalog & detail endpoints
router.get('/', tutorController.getAllTutors);
router.get('/:id', tutorController.getTutorById);

// Tutor booking & schedule endpoints
router.get('/:id/bookings', tutorController.getTutorBookings);
router.post('/:id/book', bookingLimiter, tutorController.createBooking);
router.put('/bookings/:bookingId/cancel', protect, tutorController.cancelBooking);

module.exports = router;
