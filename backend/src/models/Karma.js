const mongoose = require('mongoose');

const karmaSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      enum: [
        'post_thread',
        'comment',
        'reply',
        'upvote_received',
        'downvote_received',
        'solution_accepted',
        'ai_assist',
      ],
      required: true,
    },
    points: {
      type: Number,
      required: true,
    },
    reference: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    refModel: {
      type: String,
      enum: ['DoubtThread', 'Comment'],
      default: null,
    },
  },
  { timestamps: true }
);

// Indexes
karmaSchema.index({ user: 1, createdAt: -1 });
karmaSchema.index({ user: 1, action: 1 });

module.exports = mongoose.model('Karma', karmaSchema);
