const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const community = require('../controllers/communityController');

// ─── Thread Routes ─────────────────────────────────────────────
router.get('/threads', community.getThreads);
router.get('/threads/:id', community.getThread);
router.post('/threads', protect, community.createThread);
router.put('/threads/:id', protect, community.updateThread);
router.delete('/threads/:id', protect, community.deleteThread);

// ─── Thread Actions ────────────────────────────────────────────
router.post('/threads/:id/vote', protect, community.voteThread);
router.post('/threads/:id/bookmark', protect, community.bookmarkThread);
router.post('/threads/:id/solve', protect, community.solveThread);

// ─── Comment Routes ────────────────────────────────────────────
router.get('/threads/:id/comments', community.getComments);
router.post('/threads/:id/comments', protect, community.createComment);
router.put('/comments/:id', protect, community.updateComment);
router.delete('/comments/:id', protect, community.deleteComment);
router.post('/comments/:id/vote', protect, community.voteComment);

// ─── Leaderboard & Bookmarks ──────────────────────────────────
router.get('/leaderboard', community.getLeaderboard);
router.get('/bookmarks', protect, community.getBookmarks);

module.exports = router;
