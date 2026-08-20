const { Server } = require('socket.io');

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

  // In-memory registry for room participants & whiteboard permissions
  const roomParticipants = {}; // roomId -> { socketId: participantData }
  const socketRoomMap = {}; // socketId -> roomId
  const roomWhiteboardPermissions = {}; // roomId -> { socketId: boolean }

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
        isMuted: false,
        isCameraOff: false,
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

    // Whiteboard Permission Events
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

    // Real-Time Room Chat Broadcast
    socket.on('send-room-message', ({ roomId, message }) => {
      if (!roomId) return;
      io.to(`room:${roomId}`).emit('room-message-received', message);
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
