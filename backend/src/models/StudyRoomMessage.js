const mongoose = require('mongoose');

const studyRoomMessageSchema = new mongoose.Schema(
  {
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudyRoom',
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: [true, 'Message text is required'],
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
    },
    type: {
      type: String,
      enum: ['text', 'system', 'ai'],
      default: 'text',
    },
  },
  { timestamps: true }
);

// Load chat history in chronological order
studyRoomMessageSchema.index({ room: 1, createdAt: 1 });

module.exports = mongoose.model('StudyRoomMessage', studyRoomMessageSchema);
