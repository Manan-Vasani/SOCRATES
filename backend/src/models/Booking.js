const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    tutorId: { type: String, required: true, index: true },
    studentName: { type: String, required: true, trim: true },
    date: { type: String, required: true }, // e.g. '2026-07-25'
    time: { type: String, required: true }, // e.g. '10:00 AM'
    subject: { type: String, required: true },
    duration: { type: Number, default: 60 }, // 20, 30, or 60 minutes
    topic: { type: String, default: '' },
    fee: { type: Number, required: true },
    status: { type: String, enum: ['confirmed', 'pending', 'cancelled'], default: 'confirmed' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Booking', bookingSchema);
