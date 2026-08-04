const mongoose = require('mongoose');

const doubtThreadSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Thread title is required'],
      trim: true,
      maxlength: [300, 'Title cannot exceed 300 characters'],
    },
    content: {
      type: String,
      required: [true, 'Thread content is required'],
      maxlength: [10000, 'Content cannot exceed 10000 characters'],
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
    },
    tags: [{ type: String, trim: true }],
    codeSnippet: { type: String, default: '' },
    media: [
      {
        url: { type: String, required: true },
        type: { type: String, enum: ['image', 'video'], required: true },
        publicId: { type: String, default: null },
      },
    ],

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    upvotes: { type: Number, default: 0 },
    downvotes: { type: Number, default: 0 },
    voters: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        vote: { type: String, enum: ['up', 'down'] },
      },
    ],

    isSolved: { type: Boolean, default: false },
    solvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    hasAiAnswer: { type: Boolean, default: false },

    commentsCount: { type: Number, default: 0 },
    bookmarkedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    viewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Indexes — aligned with SOCRATES_Final_Tech_Stack.md performance requirements
doubtThreadSchema.index({ subject: 1, isSolved: 1, createdAt: -1 });
doubtThreadSchema.index({ author: 1, createdAt: -1 });
doubtThreadSchema.index({ tags: 1 });
doubtThreadSchema.index({ 'voters.user': 1 });

module.exports = mongoose.model('DoubtThread', doubtThreadSchema);
