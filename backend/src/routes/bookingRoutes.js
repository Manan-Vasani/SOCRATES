const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');

// Email action endpoints (one-click approve/decline secured via unique approval token)
router.get('/:bookingId/approve', bookingController.approveBookingViaEmail);
router.get('/:bookingId/decline', bookingController.declineBookingViaEmail);

// Booking details & status endpoint
router.get('/:bookingId/status', bookingController.getBookingStatus);

module.exports = router;
