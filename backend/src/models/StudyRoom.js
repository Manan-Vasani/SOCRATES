const mongoose = require('mongoose');

const studyRoomSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    description: { type: String, default: '', maxlength: 500 },

    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    participants: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        joinedAt: { type: Date, default: Date.now },
        role: {
          type: String,
          enum: ['host', 'member'],
          default: 'member',
        },
      },
    ],
    maxCapacity: { type: Number, default: 8, min: 2, max: 20 },

    tag: {
      type: String,
      enum: ['Public', 'Private', 'Focus', 'Whiteboard', 'Code'],
      default: 'Public',
    },
    isPrivate: { type: Boolean, default: false },
    accessCode: { type: String, default: null },

    linkedThread: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DoubtThread',
      default: null,
    },
    jitsiRoomName: { type: String, unique: true, sparse: true },

    status: {
      type: String,
      enum: ['active', 'ended'],
      default: 'active',
    },
    endedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Indexes
studyRoomSchema.index({ status: 1, subject: 1, createdAt: -1 });
studyRoomSchema.index({ host: 1, status: 1 });
studyRoomSchema.index({ jitsiRoomName: 1 });
studyRoomSchema.index({ linkedThread: 1 });

module.exports = mongoose.model('StudyRoom', studyRoomSchema);
