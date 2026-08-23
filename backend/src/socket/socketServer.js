const { Server } = require('socket.io');
const mongoose = require('mongoose');
const StudyRoomMessage = require('../models/StudyRoomMessage');
const StudyRoom = require('../models/StudyRoom');

let io = null;

/**
 * Initialize Socket.IO server attached to Express HTTP server.
 * @param {object} server - HTTP server instance
 */
function createSocketServer(server) {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
    },
  });

  // In-memory registry for room participants, permissions, whiteboard strokes & code sandbox
  const roomParticipants = {}; // roomId -> { socketId: participantData }
  const socketRoomMap = {}; // socketId -> roomId
  const roomWhiteboardPermissions = {}; // roomId -> { socketId: boolean }
  const roomWhiteboardStrokes = {}; // roomId -> Stroke[]
  const roomCodeState = {}; // roomId -> { code, language, fileName }

  // Main connection handler
  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // ─── WebRTC & Study Room Signaling ───

    // User joins a video study room
    socket.on('join-room', ({ roomId, user }) => {
      if (!roomId) return;

      socket.join(`room:${roomId}`);
      socketRoomMap[socket.id] = roomId;

      const participantData = {
        id: user.id || socket.id,
        socketId: socket.id,
        name: user.name || 'Anonymous Student',
        role: user.role || 'student',
        avatar: user.avatar || '',
        isMuted: user.isMuted ?? false,
        isCameraOff: user.isCameraOff ?? false,
        isHandRaised: false,
        isScreenSharing: false,
        hasWhiteboardPermission: user.role === 'tutor' ? true : false,
      };

      if (!roomParticipants[roomId]) {
        roomParticipants[roomId] = {};
      }
      roomParticipants[roomId][socket.id] = participantData;

      if (!roomWhiteboardPermissions[roomId]) {
        roomWhiteboardPermissions[roomId] = {};
      }
      if (user.role === 'tutor') {
        roomWhiteboardPermissions[roomId][socket.id] = true;
      }

      // Send existing participants list and permissions to joining user
      const existingParticipants = Object.values(roomParticipants[roomId]).filter(
        (p) => p.socketId !== socket.id
      );
      socket.emit('existing-participants', existingParticipants);
      socket.emit('room-whiteboard-permissions-updated', roomWhiteboardPermissions[roomId]);

      // Broadcast new-user-joined to other participants in room
      socket.to(`room:${roomId}`).emit('user-joined', participantData);

      // Send initial whiteboard strokes and code state if already present in room
      if (roomWhiteboardStrokes[roomId] && roomWhiteboardStrokes[roomId].length > 0) {
        socket.emit('whiteboard-history', roomWhiteboardStrokes[roomId]);
      }
      if (roomCodeState[roomId]) {
        socket.emit('code-sync', roomCodeState[roomId]);
      }

      console.log(`[Meeting Socket] ${participantData.name} joined room ${roomId} (${socket.id})`);
    });

    // WebRTC SDP Offer
    socket.on('offer', ({ targetSocketId, offer }) => {
      console.log(`[WebRTC Signaling] Relaying offer from ${socket.id} to ${targetSocketId}`);
      io.to(targetSocketId).emit('offer', {
        senderSocketId: socket.id,
        offer,
      });
    });

    // WebRTC SDP Answer
    socket.on('answer', ({ targetSocketId, answer }) => {
      console.log(`[WebRTC Signaling] Relaying answer from ${socket.id} to ${targetSocketId}`);
      io.to(targetSocketId).emit('answer', {
        senderSocketId: socket.id,
        answer,
      });
    });

    // WebRTC ICE Candidate
    socket.on('ice-candidate', ({ targetSocketId, candidate }) => {
      if (candidate) {
        io.to(targetSocketId).emit('ice-candidate', {
          senderSocketId: socket.id,
          candidate,
        });
      }
    });

    // Sync Participant Media & Controls State (Mic, Camera, Screen Share, Hand Raise)
    socket.on('participant-state-change', ({ roomId, state }) => {
      if (!roomId || !roomParticipants[roomId] || !roomParticipants[roomId][socket.id]) return;

      const current = roomParticipants[roomId][socket.id];
      const updated = {
        ...current,
        ...state,
      };
      roomParticipants[roomId][socket.id] = updated;

      socket.to(`room:${roomId}`).emit('participant-state-updated', {
        socketId: socket.id,
        state: updated,
      });
    });

    // Tutor Remote Mute Student Event
    socket.on('tutor-mute-participant', ({ roomId, targetSocketId }) => {
      if (!roomId || !targetSocketId) return;
      if (roomParticipants[roomId] && roomParticipants[roomId][targetSocketId]) {
        roomParticipants[roomId][targetSocketId].isMuted = true;
      }
      io.to(targetSocketId).emit('remote-muted-by-tutor');
      socket.to(`room:${roomId}`).emit('participant-state-updated', {
        socketId: targetSocketId,
        state: { isMuted: true },
      });
    });

    // ─── Whiteboard Permission & Live Stroke Sync ───

    socket.on('request-whiteboard-permission', ({ roomId, socketId, name }) => {
      if (!roomId) return;
      socket.to(`room:${roomId}`).emit('tutor-whiteboard-request-received', {
        socketId: socketId || socket.id,
        name,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    });

    socket.on('grant-whiteboard-permission', ({ roomId, targetSocketId }) => {
      if (!roomId || !targetSocketId) return;
      if (!roomWhiteboardPermissions[roomId]) roomWhiteboardPermissions[roomId] = {};
      roomWhiteboardPermissions[roomId][targetSocketId] = true;
      if (roomParticipants[roomId] && roomParticipants[roomId][targetSocketId]) {
        roomParticipants[roomId][targetSocketId].hasWhiteboardPermission = true;
      }
      io.to(targetSocketId).emit('whiteboard-permission-updated', { hasAccess: true });
      io.to(`room:${roomId}`).emit('room-whiteboard-permissions-updated', roomWhiteboardPermissions[roomId]);
    });

    socket.on('revoke-whiteboard-permission', ({ roomId, targetSocketId }) => {
      if (!roomId || !targetSocketId) return;
      if (!roomWhiteboardPermissions[roomId]) roomWhiteboardPermissions[roomId] = {};
      roomWhiteboardPermissions[roomId][targetSocketId] = false;
      if (roomParticipants[roomId] && roomParticipants[roomId][targetSocketId]) {
        roomParticipants[roomId][targetSocketId].hasWhiteboardPermission = false;
      }
      io.to(targetSocketId).emit('whiteboard-permission-updated', { hasAccess: false });
      io.to(`room:${roomId}`).emit('room-whiteboard-permissions-updated', roomWhiteboardPermissions[roomId]);
    });

    // Whiteboard Stroke Broadcast & Memory Cache
    socket.on('whiteboard-stroke', ({ roomId, stroke }) => {
      if (!roomId || !stroke) return;
      if (!roomWhiteboardStrokes[roomId]) {
        roomWhiteboardStrokes[roomId] = [];
      }
      const strokeWithId = {
        ...stroke,
        id: stroke.id || `s-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      };
      roomWhiteboardStrokes[roomId].push(strokeWithId);
      // Cap in-memory strokes to prevent unbounded memory usage (last 2000 strokes)
      if (roomWhiteboardStrokes[roomId].length > 2000) {
        roomWhiteboardStrokes[roomId].shift();
      }
      socket.to(`room:${roomId}`).emit('whiteboard-stroke', strokeWithId);
    });

    // Whiteboard Clear Event
    socket.on('whiteboard-clear', ({ roomId }) => {
      if (!roomId) return;
      roomWhiteboardStrokes[roomId] = [];
      socket.to(`room:${roomId}`).emit('whiteboard-cleared');
    });

    // Whiteboard Undo Event
    socket.on('whiteboard-undo', ({ roomId, strokeId }) => {
      if (!roomId) return;
      if (roomWhiteboardStrokes[roomId]) {
        if (strokeId) {
          roomWhiteboardStrokes[roomId] = roomWhiteboardStrokes[roomId].filter(
            (s) => s.id !== strokeId
          );
        } else {
          roomWhiteboardStrokes[roomId].pop();
        }
      }
      socket.to(`room:${roomId}`).emit('whiteboard-undo-applied', { strokeId });
    });

    // Whiteboard History Request
    socket.on('request-whiteboard-history', ({ roomId }) => {
      if (!roomId) return;
      socket.emit('whiteboard-history', roomWhiteboardStrokes[roomId] || []);
    });

    // ─── Collaborative Code Sandbox Live Sync ───

    socket.on('code-change', ({ roomId, code }) => {
      if (!roomId) return;
      if (!roomCodeState[roomId]) {
        roomCodeState[roomId] = { code: '', language: 'python', fileName: 'example.py' };
      }
      roomCodeState[roomId].code = code;
      socket.to(`room:${roomId}`).emit('code-change', { code });
    });

    socket.on('code-language-change', ({ roomId, language, fileName }) => {
      if (!roomId) return;
      if (!roomCodeState[roomId]) {
        roomCodeState[roomId] = { code: '', language: language || 'python', fileName: fileName || 'example.py' };
      } else {
        roomCodeState[roomId].language = language;
        if (fileName) roomCodeState[roomId].fileName = fileName;
      }
      socket.to(`room:${roomId}`).emit('code-language-change', { language, fileName });
    });

    socket.on('request-code-sync', ({ roomId }) => {
      if (!roomId) return;
      socket.emit('code-sync', roomCodeState[roomId] || null);
    });

    // ─── Real-Time Room Chat Broadcast & Persistent Ledger ───

    socket.on('send-room-message', async ({ roomId, message }) => {
      if (!roomId || !message) return;

      // 1. Broadcast live message immediately to all room sockets
      io.to(`room:${roomId}`).emit('room-message-received', message);

      // 2. Asynchronously persist message in MongoDB
      try {
        const isMongoId = mongoose.Types.ObjectId.isValid(roomId);
        let targetRoomId = null;

        if (isMongoId) {
          targetRoomId = roomId;
        } else {
          // Resolve StudyRoom doc by meetingId or jitsiRoomName
          const roomDoc = await StudyRoom.findOne({
            $or: [{ meetingId: roomId }, { jitsiRoomName: roomId }],
          }).select('_id');
          if (roomDoc) {
            targetRoomId = roomDoc._id;
          }
        }

        if (targetRoomId && message.senderId && mongoose.Types.ObjectId.isValid(message.senderId)) {
          await StudyRoomMessage.create({
            room: targetRoomId,
            sender: message.senderId,
            text: message.text || '',
            type: message.role === 'system' ? 'system' : message.role === 'ai' ? 'ai' : 'text',
          });
        }
      } catch (err) {
        console.error(`[Chat Persistence] Failed to store message in room ${roomId}:`, err.message);
      }
    });

    // Explicit Leave Room Event
    socket.on('leave-room', ({ roomId }) => {
      handleUserLeave(socket, roomId);
    });

    // ─── Community Thread Room Handlers ───
    socket.on('join-thread', (threadId) => {
      if (threadId) {
        socket.join(`thread:${threadId}`);
        console.log(`[Socket.IO] ${socket.id} joined thread:${threadId}`);
      }
    });

    socket.on('leave-thread', (threadId) => {
      if (threadId) {
        socket.leave(`thread:${threadId}`);
        console.log(`[Socket.IO] ${socket.id} left thread:${threadId}`);
      }
    });

    // Disconnect Cleanup
    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
      const roomId = socketRoomMap[socket.id];
      if (roomId) {
        handleUserLeave(socket, roomId);
      }
    });
  });

  function handleUserLeave(socket, roomId) {
    socket.leave(`room:${roomId}`);
    delete socketRoomMap[socket.id];

    if (roomParticipants[roomId] && roomParticipants[roomId][socket.id]) {
      const leavingUser = roomParticipants[roomId][socket.id];
      delete roomParticipants[roomId][socket.id];

      if (Object.keys(roomParticipants[roomId]).length === 0) {
        delete roomParticipants[roomId];
        delete roomWhiteboardStrokes[roomId];
        delete roomCodeState[roomId];
        delete roomWhiteboardPermissions[roomId];
      }

      console.log(`[Meeting Socket] ${socket.id} (${leavingUser.name}) left room:${roomId}`);
      io.to(`room:${roomId}`).emit('user-left', {
        socketId: socket.id,
        userId: leavingUser.id,
      });
    }
  }

  return io;
}

/**
 * Get active Socket.IO server instance
 */
function getIO() {
  if (!io) {
    throw new Error('Socket.IO is not initialized!');
  }
  return io;
}

module.exports = {
  createSocketServer,
  getIO,
};
