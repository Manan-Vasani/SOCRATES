const mongoose = require('mongoose');

const transcriptEntrySchema = new mongoose.Schema(
  {
    speakerId: { type: String, required: true },
    speakerName: { type: String, required: true },
    role: { type: String, enum: ['tutor', 'student', 'system'], default: 'student' },
    text: { type: String, required: true, trim: true },
    timeFormatted: { type: String, required: true }, // e.g. "04:52 PM"
    timestamp: { type: Date, default: Date.now },
  },
  { _id: true }
);

const sessionTranscriptSchema = new mongoose.Schema(
  {
    roomId: { type: String, required: true, index: true },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
    entries: [transcriptEntrySchema],
    totalWords: { type: Number, default: 0 },
    summary: { type: String, default: '' },
  },
  { timestamps: true }
);

sessionTranscriptSchema.index({ roomId: 1, createdAt: -1 });

module.exports = mongoose.model('SessionTranscript', sessionTranscriptSchema);
