const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    thread: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DoubtThread',
      required: true,
      index: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: [true, 'Comment content is required'],
      maxlength: [5000, 'Comment content cannot exceed 5000 characters'],
    },
    codeSnippet: {
      type: String,
      default: '',
    },
    isAccepted: {
      type: Boolean,
      default: false,
    },
    isAiGenerated: {
      type: Boolean,
      default: false,
    },
    upvotes: {
      type: Number,
      default: 0,
    },
    downvotes: {
      type: Number,
      default: 0,
    },
    voters: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        vote: {
          type: String,
          enum: ['up', 'down'],
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

commentSchema.index({ thread: 1, createdAt: 1 });

module.exports = mongoose.model('Comment', commentSchema);
