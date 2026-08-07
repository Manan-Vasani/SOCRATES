const express = require('express');
const router = express.Router();
const communityController = require('../controllers/communityController');
const { protect } = require('../middleware/authMiddleware');

// Public endpoints (threads list & single thread)
router.get('/', communityController.getThreads);
router.get('/threads', communityController.getThreads);
router.get('/:id', communityController.getThreadById);
router.get('/threads/:id', communityController.getThreadById);

// Protected endpoints (create, vote, comment, solve)
router.post('/', protect, communityController.createThread);
router.post('/threads', protect, communityController.createThread);

router.post('/:id/vote', protect, communityController.voteThread);
router.post('/threads/:id/vote', protect, communityController.voteThread);

router.post('/:id/comments', protect, communityController.addComment);
router.post('/threads/:id/comments', protect, communityController.addComment);

router.post('/comments/:commentId/vote', protect, communityController.voteComment);

router.post('/:id/solve', protect, communityController.markSolved);
router.post('/threads/:id/solve', protect, communityController.markSolved);

module.exports = router;
