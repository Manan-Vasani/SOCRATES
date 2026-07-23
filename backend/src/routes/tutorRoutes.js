const express = require('express');
const router = express.Router();
const tutorController = require('../controllers/tutorController');

// Tutor catalog & detail endpoints
router.get('/', tutorController.getAllTutors);
router.get('/:id', tutorController.getTutorById);

// Tutor booking & schedule endpoints
router.get('/:id/bookings', tutorController.getTutorBookings);
router.post('/:id/book', tutorController.createBooking);

module.exports = router;
