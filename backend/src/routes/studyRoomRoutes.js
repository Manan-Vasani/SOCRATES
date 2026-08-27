const express = require('express');
const router = express.Router();
const { protect, optionalAuth } = require('../middleware/authMiddleware');
const studyRoom = require('../controllers/studyRoomController');

// ─── Room Routes ───────────────────────────────────────────────
router.get('/', studyRoom.getRooms);
router.post('/', protect, studyRoom.createRoom);
router.get('/:id', optionalAuth, studyRoom.getRoom);

// ─── Room Actions ──────────────────────────────────────────────
router.post('/:id/join', protect, studyRoom.joinRoom);
router.post('/:id/leave', protect, studyRoom.leaveRoom);
router.post('/:id/end', protect, studyRoom.endRoom);

// ─── Room Chat, Transcript & AI Copilot ───────────────────────
router.get('/:id/messages', optionalAuth, studyRoom.getMessages);
router.get('/:id/transcript', optionalAuth, studyRoom.getTranscript);
router.post('/:id/ai-copilot', optionalAuth, studyRoom.aiCopilot);

// ─── Thread-Linked Room ────────────────────────────────────────
router.post('/from-thread/:threadId', protect, studyRoom.createRoomFromThread);

module.exports = router;
