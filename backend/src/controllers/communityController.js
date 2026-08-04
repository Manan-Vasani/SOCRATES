const DoubtThread = require('../models/DoubtThread');
const Comment = require('../models/Comment');
const Karma = require('../models/Karma');
const User = require('../models/User');

// ─── Karma Helper ──────────────────────────────────────────────
const KARMA_POINTS = {
  post_thread: 5,
  comment: 15,
  reply: 15,
  upvote_received: 10,
  downvote_received: -5,
  solution_accepted: 50,
};

async function awardKarma(userId, action, referenceId, refModel) {
  const points = KARMA_POINTS[action];
  if (!points) return;

  await Karma.create({
    user: userId,
    action,
    points,
    reference: referenceId,
    refModel,
  });

  await User.findByIdAndUpdate(userId, { $inc: { karma: points } });
}

// ─── Socratic AI Bot (First Responder) ─────────────────────────
async function generateSocraticReply(thread) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('[AI Bot] GEMINI_API_KEY not set — skipping Socratic reply');
      return null;
    }

    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `You are a Socratic tutor on an academic community platform called SOCRATES. A student just posted this doubt:

Title: ${thread.title}
Subject: ${thread.subject}
Content: ${thread.content}
${thread.codeSnippet ? `Code Snippet:\n${thread.codeSnippet}` : ''}

RULES:
- NEVER give the direct answer.
- Ask exactly 2 guiding questions to help the student discover the solution themselves.
- Be encouraging and supportive.
- Keep your response under 200 words.
- Format as plain text, not markdown.`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('[AI Bot] Socratic reply generation failed:', error.message);
    return null;
  }
}

// ─── Build Comment Tree ────────────────────────────────────────
function buildCommentTree(flatComments) {
  const map = {};
  const roots = [];

  flatComments.forEach((c) => {
    map[c._id.toString()] = { ...c.toObject(), replies: [] };
  });

  flatComments.forEach((c) => {
    const node = map[c._id.toString()];
    if (c.parentComment) {
      const parentKey = c.parentComment.toString();
      if (map[parentKey]) {
        map[parentKey].replies.push(node);
      } else {
        roots.push(node);
      }
    } else {
      roots.push(node);
    }
  });

  return roots;
}

// ═══════════════════════════════════════════════════════════════
//  THREAD CONTROLLERS
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/v1/community/threads
 * List threads with pagination, filtering, and sorting
 */
exports.getThreads = async (req, res) => {
  const {
    page = 1,
    limit = 20,
    subject,
    filter, // 'all' | 'unsolved' | 'solved'
    sort = 'hot', // 'hot' | 'new' | 'top'
    search,
  } = req.query;

  const query = {};

  if (subject && subject !== 'All') {
    query.subject = subject;
  }

  if (filter === 'unsolved') query.isSolved = false;
  if (filter === 'solved') query.isSolved = true;

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { content: { $regex: search, $options: 'i' } },
      { tags: { $regex: search, $options: 'i' } },
    ];
  }

  let sortOption = {};
  if (sort === 'new') {
    sortOption = { createdAt: -1 };
  } else if (sort === 'top') {
    sortOption = { upvotes: -1, createdAt: -1 };
  } else {
    // 'hot' — a simple scoring: upvotes weighted by recency
    sortOption = { upvotes: -1, createdAt: -1 };
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [threads, total] = await Promise.all([
    DoubtThread.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('author', 'fullName profileImage role karma isTutorVerified tutorBadge')
      .lean(),
    DoubtThread.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: threads,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
};

/**
 * GET /api/v1/community/threads/:id
 * Get single thread with full comment tree
 */
exports.getThread = async (req, res) => {
  const thread = await DoubtThread.findById(req.params.id)
    .populate('author', 'fullName profileImage role karma isTutorVerified tutorBadge')
    .populate('solvedBy', 'fullName profileImage');

  if (!thread) {
    return res.status(404).json({ success: false, message: 'Thread not found' });
  }

  // Increment view count (fire and forget)
  DoubtThread.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } }).exec();

  // Load comments and build tree
  const comments = await Comment.find({
    thread: req.params.id,
    isDeleted: false,
  })
    .sort({ createdAt: 1 })
    .populate('author', 'fullName profileImage role karma isTutorVerified tutorBadge');

  const commentTree = buildCommentTree(comments);

  res.json({
    success: true,
    data: {
      ...thread.toObject(),
      comments: commentTree,
    },
  });
};

/**
 * POST /api/v1/community/threads
 * Create a new doubt thread
 */
exports.createThread = async (req, res) => {
  const { title, content, subject, tags, codeSnippet, media } = req.body;

  const thread = await DoubtThread.create({
    title,
    content,
    subject,
    tags: tags || [],
    codeSnippet: codeSnippet || '',
    media: media || [],
    author: req.user._id,
    upvotes: 1,
    voters: [{ user: req.user._id, vote: 'up' }],
  });

  // Award karma for posting
  await awardKarma(req.user._id, 'post_thread', thread._id, 'DoubtThread');

  // Populate author for response
  await thread.populate('author', 'fullName profileImage role karma isTutorVerified tutorBadge');

  // Emit real-time event
  const io = req.app.get('io');
  if (io) {
    io.of('/community').emit('new-thread', thread);
  }

  // Async: Generate Socratic AI reply (non-blocking)
  setImmediate(async () => {
    try {
      const aiText = await generateSocraticReply(thread);
      if (aiText) {
        const aiComment = await Comment.create({
          thread: thread._id,
          parentComment: null,
          author: req.user._id, // System uses the poster's ID; role='ai' distinguishes it
          role: 'ai',
          isVerified: false,
          text: aiText,
          upvotes: 0,
        });

        await DoubtThread.findByIdAndUpdate(thread._id, {
          hasAiAnswer: true,
          $inc: { commentsCount: 1 },
        });

        // Broadcast AI comment in real-time
        if (io) {
          await aiComment.populate(
            'author',
            'fullName profileImage role karma'
          );
          io.of('/community').to(`thread:${thread._id}`).emit('new-comment', {
            ...aiComment.toObject(),
            author: { fullName: 'Socrates AI', profileImage: null, role: 'ai' },
          });
        }
      }
    } catch (err) {
      console.error('[AI Bot] Async Socratic reply error:', err.message);
    }
  });

  res.status(201).json({ success: true, data: thread });
};

/**
 * PUT /api/v1/community/threads/:id
 * Edit own thread
 */
exports.updateThread = async (req, res) => {
  const thread = await DoubtThread.findById(req.params.id);

  if (!thread) {
    return res.status(404).json({ success: false, message: 'Thread not found' });
  }

  if (thread.author.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized to edit this thread' });
  }

  const { title, content, subject, tags, codeSnippet, media } = req.body;

  if (title) thread.title = title;
  if (content) thread.content = content;
  if (subject) thread.subject = subject;
  if (tags) thread.tags = tags;
  if (codeSnippet !== undefined) thread.codeSnippet = codeSnippet;
  if (media) thread.media = media;

  await thread.save();
  await thread.populate('author', 'fullName profileImage role karma isTutorVerified tutorBadge');

  res.json({ success: true, data: thread });
};

/**
 * DELETE /api/v1/community/threads/:id
 * Soft-delete own thread
 */
exports.deleteThread = async (req, res) => {
  const thread = await DoubtThread.findById(req.params.id);

  if (!thread) {
    return res.status(404).json({ success: false, message: 'Thread not found' });
  }

  if (
    thread.author.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin'
  ) {
    return res.status(403).json({ success: false, message: 'Not authorized to delete this thread' });
  }

  await DoubtThread.findByIdAndDelete(req.params.id);

  // Also soft-delete all comments on this thread
  await Comment.updateMany(
    { thread: req.params.id },
    { isDeleted: true }
  );

  res.json({ success: true, message: 'Thread deleted' });
};

/**
 * POST /api/v1/community/threads/:id/vote
 * Upvote or downvote a thread (idempotent)
 * Body: { vote: 'up' | 'down' }
 */
exports.voteThread = async (req, res) => {
  const { vote } = req.body;

  if (!['up', 'down'].includes(vote)) {
    return res.status(400).json({ success: false, message: 'Vote must be "up" or "down"' });
  }

  const thread = await DoubtThread.findById(req.params.id);
  if (!thread) {
    return res.status(404).json({ success: false, message: 'Thread not found' });
  }

  const userId = req.user._id.toString();
  const existingVoteIndex = thread.voters.findIndex(
    (v) => v.user.toString() === userId
  );

  if (existingVoteIndex > -1) {
    const existingVote = thread.voters[existingVoteIndex].vote;

    if (existingVote === vote) {
      // Remove vote (toggle off)
      thread.voters.splice(existingVoteIndex, 1);
      if (vote === 'up') {
        thread.upvotes = Math.max(0, thread.upvotes - 1);
      } else {
        thread.downvotes = Math.max(0, thread.downvotes - 1);
      }
    } else {
      // Switch vote direction
      thread.voters[existingVoteIndex].vote = vote;
      if (vote === 'up') {
        thread.upvotes += 1;
        thread.downvotes = Math.max(0, thread.downvotes - 1);
      } else {
        thread.downvotes += 1;
        thread.upvotes = Math.max(0, thread.upvotes - 1);
      }
    }
  } else {
    // New vote
    thread.voters.push({ user: req.user._id, vote });
    if (vote === 'up') {
      thread.upvotes += 1;
      // Award karma to thread author
      if (thread.author.toString() !== userId) {
        await awardKarma(thread.author, 'upvote_received', thread._id, 'DoubtThread');
      }
    } else {
      thread.downvotes += 1;
      if (thread.author.toString() !== userId) {
        await awardKarma(thread.author, 'downvote_received', thread._id, 'DoubtThread');
      }
    }
  }

  await thread.save();

  // Emit real-time vote update
  const io = req.app.get('io');
  if (io) {
    io.of('/community').to(`thread:${thread._id}`).emit('vote-update', {
      threadId: thread._id,
      upvotes: thread.upvotes,
      downvotes: thread.downvotes,
    });
  }

  res.json({
    success: true,
    data: {
      upvotes: thread.upvotes,
      downvotes: thread.downvotes,
      userVote: thread.voters.find((v) => v.user.toString() === userId)?.vote || null,
    },
  });
};

/**
 * POST /api/v1/community/threads/:id/bookmark
 * Toggle bookmark on a thread
 */
exports.bookmarkThread = async (req, res) => {
  const thread = await DoubtThread.findById(req.params.id);
  if (!thread) {
    return res.status(404).json({ success: false, message: 'Thread not found' });
  }

  const userId = req.user._id;
  const isBookmarked = thread.bookmarkedBy.some(
    (id) => id.toString() === userId.toString()
  );

  if (isBookmarked) {
    thread.bookmarkedBy.pull(userId);
    await User.findByIdAndUpdate(userId, { $pull: { bookmarks: thread._id } });
  } else {
    thread.bookmarkedBy.push(userId);
    await User.findByIdAndUpdate(userId, { $addToSet: { bookmarks: thread._id } });
  }

  await thread.save();

  res.json({
    success: true,
    data: { isBookmarked: !isBookmarked },
  });
};

/**
 * POST /api/v1/community/threads/:id/solve
 * Mark thread as solved (OP or admin only)
 * Body: { solvedByCommentAuthor: <userId> } — optional, to credit the solver
 */
exports.solveThread = async (req, res) => {
  const thread = await DoubtThread.findById(req.params.id);
  if (!thread) {
    return res.status(404).json({ success: false, message: 'Thread not found' });
  }

  if (
    thread.author.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin'
  ) {
    return res.status(403).json({ success: false, message: 'Only the author or admin can mark as solved' });
  }

  thread.isSolved = !thread.isSolved;

  if (thread.isSolved && req.body.solvedByCommentAuthor) {
    thread.solvedBy = req.body.solvedByCommentAuthor;
    await awardKarma(
      req.body.solvedByCommentAuthor,
      'solution_accepted',
      thread._id,
      'DoubtThread'
    );
    await User.findByIdAndUpdate(req.body.solvedByCommentAuthor, {
      $inc: { solvedCount: 1 },
    });
  } else if (!thread.isSolved) {
    thread.solvedBy = null;
  }

  await thread.save();

  // Emit real-time solved status
  const io = req.app.get('io');
  if (io) {
    io.of('/community').to(`thread:${thread._id}`).emit('thread-solved', {
      threadId: thread._id,
      isSolved: thread.isSolved,
    });
  }

  res.json({ success: true, data: { isSolved: thread.isSolved } });
};

// ═══════════════════════════════════════════════════════════════
//  COMMENT CONTROLLERS
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/v1/community/threads/:id/comments
 * Get all comments for a thread (flat list — frontend builds tree, or we build it here)
 */
exports.getComments = async (req, res) => {
  const comments = await Comment.find({
    thread: req.params.id,
    isDeleted: false,
  })
    .sort({ createdAt: 1 })
    .populate('author', 'fullName profileImage role karma isTutorVerified tutorBadge');

  const tree = buildCommentTree(comments);

  res.json({ success: true, data: tree });
};

/**
 * POST /api/v1/community/threads/:id/comments
 * Add a comment or reply to a thread
 * Body: { text, parentComment?, media? }
 */
exports.createComment = async (req, res) => {
  const { text, parentComment, media } = req.body;

  const thread = await DoubtThread.findById(req.params.id);
  if (!thread) {
    return res.status(404).json({ success: false, message: 'Thread not found' });
  }

  // If replying, validate parent exists
  if (parentComment) {
    const parent = await Comment.findById(parentComment);
    if (!parent || parent.thread.toString() !== req.params.id) {
      return res.status(400).json({ success: false, message: 'Invalid parent comment' });
    }
  }

  const userRole = req.user.role === 'tutor' || req.user.role === 'both'
    ? 'tutor'
    : 'student';

  const comment = await Comment.create({
    thread: req.params.id,
    parentComment: parentComment || null,
    author: req.user._id,
    role: userRole,
    isVerified: req.user.isTutorVerified || false,
    text,
    media: media || [],
  });

  // Increment thread comment count
  await DoubtThread.findByIdAndUpdate(req.params.id, {
    $inc: { commentsCount: 1 },
  });

  // Award karma
  const action = parentComment ? 'reply' : 'comment';
  await awardKarma(req.user._id, action, comment._id, 'Comment');

  await comment.populate(
    'author',
    'fullName profileImage role karma isTutorVerified tutorBadge'
  );

  // Emit real-time comment
  const io = req.app.get('io');
  if (io) {
    io.of('/community').to(`thread:${req.params.id}`).emit('new-comment', comment);
  }

  res.status(201).json({ success: true, data: comment });
};

/**
 * PUT /api/v1/community/comments/:id
 * Edit own comment
 */
exports.updateComment = async (req, res) => {
  const comment = await Comment.findById(req.params.id);

  if (!comment || comment.isDeleted) {
    return res.status(404).json({ success: false, message: 'Comment not found' });
  }

  if (comment.author.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized to edit this comment' });
  }

  comment.text = req.body.text || comment.text;
  comment.isEdited = true;
  await comment.save();

  await comment.populate(
    'author',
    'fullName profileImage role karma isTutorVerified tutorBadge'
  );

  res.json({ success: true, data: comment });
};

/**
 * DELETE /api/v1/community/comments/:id
 * Soft-delete own comment (preserves thread structure)
 */
exports.deleteComment = async (req, res) => {
  const comment = await Comment.findById(req.params.id);

  if (!comment) {
    return res.status(404).json({ success: false, message: 'Comment not found' });
  }

  if (
    comment.author.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin'
  ) {
    return res.status(403).json({ success: false, message: 'Not authorized to delete this comment' });
  }

  comment.isDeleted = true;
  comment.text = '[deleted]';
  await comment.save();

  await DoubtThread.findByIdAndUpdate(comment.thread, {
    $inc: { commentsCount: -1 },
  });

  res.json({ success: true, message: 'Comment deleted' });
};

/**
 * POST /api/v1/community/comments/:id/vote
 * Upvote or downvote a comment (idempotent)
 * Body: { vote: 'up' | 'down' }
 */
exports.voteComment = async (req, res) => {
  const { vote } = req.body;

  if (!['up', 'down'].includes(vote)) {
    return res.status(400).json({ success: false, message: 'Vote must be "up" or "down"' });
  }

  const comment = await Comment.findById(req.params.id);
  if (!comment || comment.isDeleted) {
    return res.status(404).json({ success: false, message: 'Comment not found' });
  }

  const userId = req.user._id.toString();
  const existingVoteIndex = comment.voters.findIndex(
    (v) => v.user.toString() === userId
  );

  if (existingVoteIndex > -1) {
    const existingVote = comment.voters[existingVoteIndex].vote;

    if (existingVote === vote) {
      comment.voters.splice(existingVoteIndex, 1);
      if (vote === 'up') {
        comment.upvotes = Math.max(0, comment.upvotes - 1);
      } else {
        comment.downvotes = Math.max(0, comment.downvotes - 1);
      }
    } else {
      comment.voters[existingVoteIndex].vote = vote;
      if (vote === 'up') {
        comment.upvotes += 1;
        comment.downvotes = Math.max(0, comment.downvotes - 1);
      } else {
        comment.downvotes += 1;
        comment.upvotes = Math.max(0, comment.upvotes - 1);
      }
    }
  } else {
    comment.voters.push({ user: req.user._id, vote });
    if (vote === 'up') {
      comment.upvotes += 1;
      if (comment.author.toString() !== userId) {
        await awardKarma(comment.author, 'upvote_received', comment._id, 'Comment');
      }
    } else {
      comment.downvotes += 1;
      if (comment.author.toString() !== userId) {
        await awardKarma(comment.author, 'downvote_received', comment._id, 'Comment');
      }
    }
  }

  await comment.save();

  res.json({
    success: true,
    data: {
      upvotes: comment.upvotes,
      downvotes: comment.downvotes,
      userVote: comment.voters.find((v) => v.user.toString() === userId)?.vote || null,
    },
  });
};

// ═══════════════════════════════════════════════════════════════
//  LEADERBOARD & BOOKMARKS
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/v1/community/leaderboard
 * Top contributors by karma
 */
exports.getLeaderboard = async (req, res) => {
  const { limit = 10 } = req.query;

  const topUsers = await User.find({ karma: { $gt: 0 } })
    .sort({ karma: -1 })
    .limit(parseInt(limit))
    .select('fullName profileImage karma solvedCount tutorBadge role isTutorVerified')
    .lean();

  res.json({ success: true, data: topUsers });
};

/**
 * GET /api/v1/community/bookmarks
 * User's bookmarked threads
 */
exports.getBookmarks = async (req, res) => {
  const user = await User.findById(req.user._id).select('bookmarks');

  const threads = await DoubtThread.find({
    _id: { $in: user.bookmarks || [] },
  })
    .sort({ createdAt: -1 })
    .populate('author', 'fullName profileImage role karma')
    .lean();

  res.json({ success: true, data: threads });
};
