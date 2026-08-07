const mongoose = require('mongoose');

const karmaSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    points: {
      type: Number,
      required: true,
    },
    action: {
      type: String,
      enum: [
        'THREAD_CREATED',
        'UPVOTE_RECEIVED',
        'DOWNVOTE_RECEIVED',
        'COMMENT_CREATED',
        'SOLUTION_ACCEPTED',
      ],
      required: true,
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

karmaSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Karma', karmaSchema);
