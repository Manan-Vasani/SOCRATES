const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const StudyRoomMessage = require('../models/StudyRoomMessage');

/**
 * Create and configure the Socket.IO server
 * @param {import('http').Server} httpServer - The HTTP server instance
 * @returns {import('socket.io').Server} - The Socket.IO server instance
 */
function createSocketServer(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: true,
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // ─── Auth Middleware (optional — extracts user if token present) ────
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(' ')[1];

      if (token) {
        const secret =
          process.env.JWT_SECRET || 'socrates_secret_jwt_key_2026_dev';
        const decoded = jwt.verify(token, secret);
        const user = await User.findById(decoded.id).select(
          'fullName profileImage role'
        );
        if (user) {
          socket.user = user;
        }
      }
    } catch (err) {
      // Auth is optional — allow connection without valid token
      console.warn('[Socket] Auth extraction failed:', err.message);
    }
    next();
  });

  // ═══════════════════════════════════════════════════════════════
  //  COMMUNITY NAMESPACE  —  /community
  // ═══════════════════════════════════════════════════════════════
  const communityNsp = io.of('/community');

  communityNsp.on('connection', (socket) => {
    const userName = socket.user?.fullName || 'Anonymous';
    console.log(`[Community] ${userName} connected (${socket.id})`);

    // Join a specific thread room for live updates
    socket.on('join-thread', ({ threadId }) => {
      if (threadId) {
        socket.join(`thread:${threadId}`);
      }
    });

    // Leave a thread room
    socket.on('leave-thread', ({ threadId }) => {
      if (threadId) {
        socket.leave(`thread:${threadId}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Community] ${userName} disconnected (${socket.id})`);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  //  STUDY ROOM NAMESPACE  —  /study-room
  // ═══════════════════════════════════════════════════════════════
  const studyRoomNsp = io.of('/study-room');

  studyRoomNsp.on('connection', (socket) => {
    const userName = socket.user?.fullName || 'Anonymous';
    console.log(`[StudyRoom] ${userName} connected (${socket.id})`);

    // Join a specific study room
    socket.on('join-room', ({ roomId }) => {
      if (roomId) {
        socket.join(`room:${roomId}`);
        console.log(`[StudyRoom] ${userName} joined room:${roomId}`);
      }
    });

    // Leave a study room
    socket.on('leave-room', ({ roomId }) => {
      if (roomId) {
        socket.leave(`room:${roomId}`);
        console.log(`[StudyRoom] ${userName} left room:${roomId}`);
      }
    });

    // Chat message in study room
    socket.on('send-message', async ({ roomId, text }) => {
      if (!socket.user || !roomId || !text) return;

      try {
        const message = await StudyRoomMessage.create({
          room: roomId,
          sender: socket.user._id,
          text,
          type: 'text',
        });

        const populated = await StudyRoomMessage.findById(message._id)
          .populate('sender', 'fullName profileImage')
          .lean();

        studyRoomNsp.to(`room:${roomId}`).emit('new-message', populated);
      } catch (err) {
        console.error('[StudyRoom] Message save error:', err.message);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Hand raise toggle
    socket.on('hand-raised', ({ roomId, userId, isRaised }) => {
      if (roomId) {
        socket.to(`room:${roomId}`).emit('hand-raised', { userId, isRaised });
      }
    });

    // Mic toggle sync
    socket.on('mic-toggled', ({ roomId, userId, isMicOn }) => {
      if (roomId) {
        socket.to(`room:${roomId}`).emit('mic-toggled', { userId, isMicOn });
      }
    });

    // Camera toggle sync
    socket.on('camera-toggled', ({ roomId, userId, isCameraOn }) => {
      if (roomId) {
        socket
          .to(`room:${roomId}`)
          .emit('camera-toggled', { userId, isCameraOn });
      }
    });

    socket.on('disconnect', () => {
      console.log(`[StudyRoom] ${userName} disconnected (${socket.id})`);
    });
  });

  console.log('[Socket.IO] Server initialized with /community and /study-room namespaces');
  return io;
}

module.exports = { createSocketServer };
