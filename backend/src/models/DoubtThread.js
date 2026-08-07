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
      required: [true, 'Subject category is required'],
      trim: true,
      index: true,
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    codeSnippet: {
      type: String,
      default: '',
    },
    media: [
      {
        url: String,
        type: {
          type: String,
          enum: ['image', 'video'],
          default: 'image',
        },
        publicId: String,
      },
    ],
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
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
    isSolved: {
      type: Boolean,
      default: false,
      index: true,
    },
    solvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    hasAiAnswer: {
      type: Boolean,
      default: false,
    },
    commentsCount: {
      type: Number,
      default: 0,
    },
    viewsCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

doubtThreadSchema.index({ createdAt: -1 });
doubtThreadSchema.index({ upvotes: -1 });

module.exports = mongoose.model('DoubtThread', doubtThreadSchema);
