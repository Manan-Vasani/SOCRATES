const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    tutorId: { type: String, required: true, index: true },
    tutorName: { type: String, trim: true, default: '' },
    tutorEmail: { type: String, trim: true, lowercase: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    studentName: { type: String, required: true, trim: true },
    studentEmail: { type: String, trim: true, lowercase: true },
    date: { type: String, required: true }, // e.g. '2026-07-25'
    time: { type: String, required: true }, // e.g. '10:00 AM'
    subject: { type: String, required: true },
    duration: { type: Number, default: 60 }, // 20, 30, or 60 minutes
    topic: { type: String, default: '' },
    fee: { type: Number, required: true },
    meetingId: { type: String, index: true },
    approvalToken: { type: String, index: true },
    isGroupSession: { type: Boolean, default: false },
    participants: [
      {
        studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        studentName: { type: String, trim: true },
        studentEmail: { type: String, trim: true, lowercase: true },
        joinedAt: { type: Date, default: Date.now },
      },
    ],
    status: { type: String, enum: ['confirmed', 'pending', 'cancelled'], default: 'pending' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Booking', bookingSchema);


