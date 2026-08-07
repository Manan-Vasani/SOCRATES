const DoubtThread = require('../models/DoubtThread');
const Comment = require('../models/Comment');
const Karma = require('../models/Karma');
const User = require('../models/User');
const axios = require('axios');

/**
 * Helper to update user karma ledger
 */
async function awardKarma(userId, points, action, referenceId = null) {
  try {
    await Karma.create({ user: userId, points, action, referenceId });
    await User.findByIdAndUpdate(userId, { $inc: { karma: points } });
  } catch (err) {
    console.error('[Karma Error]', err.message);
  }
}

/**
 * Trigger background Socratic AI Bot answer
 */
async function triggerAiFirstResponder(thread, io) {
  try {
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    const response = await axios.post(`${aiServiceUrl}/api/v1/ai/tutor/chat`, {
      message: `Direct Question: "${thread.title}". Details: "${thread.content}". Subject: ${thread.subject}. Provide a brief, encouraging Socratic hint or structural guidance to help the student think through this step by step.`,
      history: [],
      subject: thread.subject,
    }, { timeout: 8000 });

    const aiReply = response.data?.reply || response.data?.message;
    if (aiReply) {
      // Find or create Socratic AI Bot user
      let aiUser = await User.findOne({ email: 'socratic-ai@socrates.edu' });
      if (!aiUser) {
        aiUser = await User.create({
          fullName: 'Socratic AI Assistant',
          email: 'socratic-ai@socrates.edu',
          password: 'ai-bot-secure-pass',
          role: 'both',
          profileImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
          karma: 9999,
        });
      }

      const comment = await Comment.create({
        thread: thread._id,
        author: aiUser._id,
        content: `🤖 **Socratic AI Assistant Hint**:\n\n${aiReply}`,
        isAiGenerated: true,
      });

      thread.commentsCount += 1;
      thread.hasAiAnswer = true;
      await thread.save();

      const populatedComment = await Comment.findById(comment._id).populate('author', 'name avatar role karma');

      if (io) {
        io.to(`thread:${thread._id}`).emit('new-comment', populatedComment);
      }
    }
  } catch (err) {
    console.log('[AI Bot] Skipping Socratic AI comment:', err.message);
  }
}

/**
 * Get paginated list of doubt threads
 */
exports.getThreads = async (req, res) => {
  try {
    const {
      subject = 'All',
      tag,
      filter = 'all',
      sort = 'latest',
      search = '',
      page = 1,
      limit = 15,
    } = req.query;

    const query = {};

    if (subject && subject !== 'All') {
      query.subject = subject;
    }

    if (tag) {
      query.tags = tag.toLowerCase();
    }

    if (filter === 'unsolved') {
      query.isSolved = false;
    } else if (filter === 'solved') {
      query.isSolved = true;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
      ];
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'popular') {
      sortOption = { upvotes: -1, createdAt: -1 };
    } else if (sort === 'most-commented') {
      sortOption = { commentsCount: -1, createdAt: -1 };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [threads, total] = await Promise.all([
      DoubtThread.find(query)
        .sort(sortOption)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('author', 'name avatar role karma institution'),
      DoubtThread.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      threads,
      data: threads,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('[getThreads Error]', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving community threads' });
  }
};

/**
 * Get single thread with populated comments
 */
exports.getThreadById = async (req, res) => {
  try {
    const { id } = req.params;

    const thread = await DoubtThread.findByIdAndUpdate(
      id,
      { $inc: { viewsCount: 1 } },
      { new: true }
    ).populate('author', 'name avatar role karma institution');

    if (!thread) {
      return res.status(404).json({ success: false, message: 'Doubt thread not found' });
    }

    const comments = await Comment.find({ thread: id })
      .sort({ isAccepted: -1, upvotes: -1, createdAt: 1 })
      .populate('author', 'name avatar role karma institution');

    return res.status(200).json({
      success: true,
      thread,
      comments,
      data: {
        ...thread.toObject(),
        comments,
      },
    });
  } catch (error) {
    console.error('[getThreadById Error]', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving thread details' });
  }
};

/**
 * Create a new doubt thread
 */
exports.createThread = async (req, res) => {
  try {
    const { title, content, subject, tags = [], codeSnippet = '', media = [] } = req.body;
    const authorId = req.user._id;

    if (!title || !content || !subject) {
      return res.status(400).json({ success: false, message: 'Title, content, and subject are required' });
    }

    const formattedTags = Array.isArray(tags)
      ? tags.map((t) => t.trim().toLowerCase())
      : tags.split(',').map((t) => t.trim().toLowerCase());

    const thread = await DoubtThread.create({
      title,
      content,
      subject,
      tags: formattedTags,
      codeSnippet,
      media,
      author: authorId,
    });

    // Award +5 Karma for asking a question
    await awardKarma(authorId, 5, 'THREAD_CREATED', thread._id);

    const populatedThread = await DoubtThread.findById(thread._id).populate('author', 'name avatar role karma institution');

    // Socket.IO real-time broadcast
    const io = req.app.get('io');
    if (io) {
      io.emit('new-thread', populatedThread);
    }

    // Trigger async Socratic AI Bot responder
    triggerAiFirstResponder(thread, io);

    return res.status(201).json({
      success: true,
      message: 'Doubt thread created successfully',
      thread: populatedThread,
    });
  } catch (error) {
    console.error('[createThread Error]', error);
    return res.status(500).json({ success: false, message: 'Server error creating doubt thread' });
  }
};

/**
 * Vote on a thread (Upvote / Downvote)
 */
exports.voteThread = async (req, res) => {
  try {
    const { id } = req.params;
    const { voteType } = req.body; // 'up' or 'down'
    const userId = req.user._id;

    if (!['up', 'down'].includes(voteType)) {
      return res.status(400).json({ success: false, message: 'Vote type must be "up" or "down"' });
    }

    const thread = await DoubtThread.findById(id);
    if (!thread) {
      return res.status(404).json({ success: false, message: 'Thread not found' });
    }

    const existingVoteIndex = thread.voters.findIndex((v) => v.user.toString() === userId.toString());

    if (existingVoteIndex > -1) {
      const existingVote = thread.voters[existingVoteIndex].vote;
      if (existingVote === voteType) {
        // Toggle off vote
        if (voteType === 'up') thread.upvotes = Math.max(0, thread.upvotes - 1);
        else thread.downvotes = Math.max(0, thread.downvotes - 1);
        thread.voters.splice(existingVoteIndex, 1);
      } else {
        // Switch vote
        if (voteType === 'up') {
          thread.upvotes += 1;
          thread.downvotes = Math.max(0, thread.downvotes - 1);
        } else {
          thread.downvotes += 1;
          thread.upvotes = Math.max(0, thread.upvotes - 1);
        }
        thread.voters[existingVoteIndex].vote = voteType;
      }
    } else {
      // New vote
      if (voteType === 'up') {
        thread.upvotes += 1;
        await awardKarma(thread.author, 2, 'UPVOTE_RECEIVED', thread._id);
      } else {
        thread.downvotes += 1;
      }
      thread.voters.push({ user: userId, vote: voteType });
    }

    await thread.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('thread-vote-updated', {
        threadId: thread._id,
        upvotes: thread.upvotes,
        downvotes: thread.downvotes,
      });
    }

    return res.status(200).json({
      success: true,
      upvotes: thread.upvotes,
      downvotes: thread.downvotes,
      voters: thread.voters,
    });
  } catch (error) {
    console.error('[voteThread Error]', error);
    return res.status(500).json({ success: false, message: 'Server error casting thread vote' });
  }
};

/**
 * Add a comment/answer to a thread
 */
exports.addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, codeSnippet = '' } = req.body;
    const authorId = req.user._id;

    if (!content) {
      return res.status(400).json({ success: false, message: 'Comment content is required' });
    }

    const thread = await DoubtThread.findById(id);
    if (!thread) {
      return res.status(404).json({ success: false, message: 'Thread not found' });
    }

    const comment = await Comment.create({
      thread: id,
      author: authorId,
      content,
      codeSnippet,
    });

    thread.commentsCount += 1;
    await thread.save();

    await awardKarma(authorId, 3, 'COMMENT_CREATED', comment._id);

    const populatedComment = await Comment.findById(comment._id).populate('author', 'name avatar role karma institution');

    const io = req.app.get('io');
    if (io) {
      io.to(`thread:${id}`).emit('new-comment', populatedComment);
    }

    return res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      comment: populatedComment,
    });
  } catch (error) {
    console.error('[addComment Error]', error);
    return res.status(500).json({ success: false, message: 'Server error posting comment' });
  }
};

/**
 * Vote on a comment
 */
exports.voteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { voteType } = req.body;
    const userId = req.user._id;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    const existingIndex = comment.voters.findIndex((v) => v.user.toString() === userId.toString());

    if (existingIndex > -1) {
      const existingVote = comment.voters[existingIndex].vote;
      if (existingVote === voteType) {
        if (voteType === 'up') comment.upvotes = Math.max(0, comment.upvotes - 1);
        else comment.downvotes = Math.max(0, comment.downvotes - 1);
        comment.voters.splice(existingIndex, 1);
      } else {
        if (voteType === 'up') {
          comment.upvotes += 1;
          comment.downvotes = Math.max(0, comment.downvotes - 1);
        } else {
          comment.downvotes += 1;
          comment.upvotes = Math.max(0, comment.upvotes - 1);
        }
        comment.voters[existingIndex].vote = voteType;
      }
    } else {
      if (voteType === 'up') {
        comment.upvotes += 1;
        await awardKarma(comment.author, 2, 'UPVOTE_RECEIVED', comment._id);
      } else {
        comment.downvotes += 1;
      }
      comment.voters.push({ user: userId, vote: voteType });
    }

    await comment.save();

    const io = req.app.get('io');
    if (io) {
      io.to(`thread:${comment.thread}`).emit('comment-vote-updated', {
        commentId: comment._id,
        upvotes: comment.upvotes,
        downvotes: comment.downvotes,
      });
    }

    return res.status(200).json({
      success: true,
      upvotes: comment.upvotes,
      downvotes: comment.downvotes,
    });
  } catch (error) {
    console.error('[voteComment Error]', error);
    return res.status(500).json({ success: false, message: 'Server error voting on comment' });
  }
};

/**
 * Mark a thread as solved by a comment solution
 */
exports.markSolved = async (req, res) => {
  try {
    const { id } = req.params;
    const { commentId } = req.body;

    const thread = await DoubtThread.findById(id);
    if (!thread) {
      return res.status(404).json({ success: false, message: 'Thread not found' });
    }

    if (thread.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only thread author can mark thread as solved' });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Solution comment not found' });
    }

    comment.isAccepted = true;
    await comment.save();

    thread.isSolved = true;
    thread.solvedBy = comment.author;
    await thread.save();

    await awardKarma(comment.author, 15, 'SOLUTION_ACCEPTED', comment._id);

    return res.status(200).json({
      success: true,
      message: 'Thread marked as solved',
      thread,
      comment,
    });
  } catch (error) {
    console.error('[markSolved Error]', error);
    return res.status(500).json({ success: false, message: 'Server error marking thread solved' });
  }
};
