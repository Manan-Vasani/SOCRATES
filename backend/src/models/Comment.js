const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    thread: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DoubtThread',
      required: true,
    },
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
    },

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ['student', 'tutor', 'ai'],
      default: 'student',
    },
    isVerified: { type: Boolean, default: false },

    text: {
      type: String,
      required: [true, 'Comment text is required'],
      maxlength: [5000, 'Comment cannot exceed 5000 characters'],
    },
    media: [
      {
        url: { type: String, required: true },
        type: { type: String, enum: ['image', 'video'], required: true },
        publicId: { type: String, default: null },
      },
    ],

    upvotes: { type: Number, default: 0 },
    downvotes: { type: Number, default: 0 },
    voters: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        vote: { type: String, enum: ['up', 'down'] },
      },
    ],

    isEdited: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Indexes
commentSchema.index({ thread: 1, createdAt: 1 });
commentSchema.index({ parentComment: 1 });
commentSchema.index({ author: 1, createdAt: -1 });

module.exports = mongoose.model('Comment', commentSchema);
