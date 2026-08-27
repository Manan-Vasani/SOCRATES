const { Server } = require('socket.io');
const mongoose = require('mongoose');
const StudyRoomMessage = require('../models/StudyRoomMessage');
const StudyRoom = require('../models/StudyRoom');
const SessionTranscript = require('../models/SessionTranscript');

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
  const roomWhiteboardBg = {}; // roomId -> bgType ('dots' | 'grid' | 'blank' | 'dark' | 'chalkboard')
  const roomWhiteboardTextItems = {}; // roomId -> TextItem[]
  const roomCodeState = {}; // roomId -> { code, language, fileName }
  const disconnectTimers = {}; // `${roomId}:${userId}` -> NodeJS.Timeout
  const roomCleanupTimers = {}; // roomId -> NodeJS.Timeout

  // Main connection handler
  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // ─── WebRTC & Study Room Signaling ───

    // User joins a video study room
    socket.on('join-room', ({ roomId, user }) => {
      if (!roomId || !user) return;

      socket.join(`room:${roomId}`);
      socketRoomMap[socket.id] = roomId;

      const userId = user.id || socket.id;
      const disconnectKey = `${roomId}:${userId}`;

      // Check if user is reconnecting within the refresh grace period
      const isReconnecting = Boolean(disconnectTimers[disconnectKey]);
      if (isReconnecting) {
        clearTimeout(disconnectTimers[disconnectKey]);
        delete disconnectTimers[disconnectKey];
        console.log(`[Meeting Socket] ${user.name} (${userId}) seamlessly reconnected to room:${roomId}`);
      }

      if (roomCleanupTimers[roomId]) {
        clearTimeout(roomCleanupTimers[roomId]);
        delete roomCleanupTimers[roomId];
      }

      const participantData = {
        id: userId,
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
      // Remove any stale socket entry for this same user
      Object.keys(roomParticipants[roomId]).forEach((sId) => {
        if (roomParticipants[roomId][sId]?.id === userId && sId !== socket.id) {
          delete roomParticipants[roomId][sId];
        }
      });
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

      if (isReconnecting) {
        // Reconnected seamlessly on page refresh: notify peers for WebRTC without chat spam
        socket.to(`room:${roomId}`).emit('user-reconnected', participantData);
      } else {
        // Genuine first-time join: broadcast to other participants
        socket.to(`room:${roomId}`).emit('user-joined', participantData);
      }

      // Send initial whiteboard strokes and code state if already present in room
      if (roomWhiteboardStrokes[roomId] && roomWhiteboardStrokes[roomId].length > 0) {
        socket.emit('whiteboard-history', {
          strokes: roomWhiteboardStrokes[roomId],
          bgType: roomWhiteboardBg[roomId] || 'dots',
          textItems: roomWhiteboardTextItems[roomId] || [],
        });
      }
      if (roomCodeState[roomId]) {
        socket.emit('code-sync', roomCodeState[roomId]);
      }

      console.log(`[Meeting Socket] ${participantData.name} joined room ${roomId} (${socket.id}) [reconnect: ${isReconnecting}]`);
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

    // Tutor Remote Unmute Student Event
    socket.on('tutor-unmute-participant', ({ roomId, targetSocketId }) => {
      if (!roomId || !targetSocketId) return;
      if (roomParticipants[roomId] && roomParticipants[roomId][targetSocketId]) {
        roomParticipants[roomId][targetSocketId].isMuted = false;
      }
      io.to(targetSocketId).emit('remote-unmuted-by-tutor');
      socket.to(`room:${roomId}`).emit('participant-state-updated', {
        socketId: targetSocketId,
        state: { isMuted: false },
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

    // Whiteboard Real-Time Live Stroke Progress (Streamed while dragging)
    socket.on('whiteboard-stroke-progress', ({ roomId, stroke }) => {
      if (!roomId || !stroke) return;
      socket.to(`room:${roomId}`).emit('whiteboard-stroke-progress', stroke);
    });

    // Whiteboard Live Stroke End (Finalizing / cleaning up temporary stroke preview)
    socket.on('whiteboard-stroke-end', ({ roomId, strokeId }) => {
      if (!roomId || !strokeId) return;
      socket.to(`room:${roomId}`).emit('whiteboard-stroke-end', { strokeId });
    });

    // Whiteboard Live Text Progress (Streamed word by word / character by character while typing)
    socket.on('whiteboard-text-progress', ({ roomId, textItem }) => {
      if (!roomId || !textItem) return;
      socket.to(`room:${roomId}`).emit('whiteboard-text-progress', textItem);
    });

    // Whiteboard Live Text End (Finalizing / cleaning up temporary text preview)
    socket.on('whiteboard-text-progress-end', ({ roomId, textItemId }) => {
      if (!roomId || !textItemId) return;
      socket.to(`room:${roomId}`).emit('whiteboard-text-progress-end', { textItemId });
    });

    // Whiteboard Erase Stroke Event
    socket.on('whiteboard-erase-stroke', ({ roomId, strokeId }) => {
      if (!roomId || !strokeId) return;
      if (roomWhiteboardStrokes[roomId]) {
        roomWhiteboardStrokes[roomId] = roomWhiteboardStrokes[roomId].filter(
          (s) => s.id !== strokeId
        );
      }
      socket.to(`room:${roomId}`).emit('whiteboard-erase-stroke', { strokeId });
    });

    // Whiteboard Stroke Broadcast & Memory Cache (Final committed stroke on mouseUp)
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

    // Whiteboard Background Style Change Event
    socket.on('whiteboard-bg-change', ({ roomId, bgType }) => {
      if (!roomId || !bgType) return;
      roomWhiteboardBg[roomId] = bgType;
      socket.to(`room:${roomId}`).emit('whiteboard-bg-updated', { bgType });
    });

    // Whiteboard Text Item Add Event
    socket.on('whiteboard-text-item-add', ({ roomId, textItem }) => {
      if (!roomId || !textItem) return;
      if (!roomWhiteboardTextItems[roomId]) roomWhiteboardTextItems[roomId] = [];
      const idx = roomWhiteboardTextItems[roomId].findIndex((t) => t.id === textItem.id);
      if (idx !== -1) {
        roomWhiteboardTextItems[roomId][idx] = textItem;
      } else {
        roomWhiteboardTextItems[roomId].push(textItem);
      }
      socket.to(`room:${roomId}`).emit('whiteboard-text-item-added', textItem);
    });

    // Whiteboard Text Item Update Event (Move, Edit, Color, Font Size Change)
    socket.on('whiteboard-text-item-update', ({ roomId, textItem }) => {
      if (!roomId || !textItem) return;
      if (!roomWhiteboardTextItems[roomId]) roomWhiteboardTextItems[roomId] = [];
      const idx = roomWhiteboardTextItems[roomId].findIndex((t) => t.id === textItem.id);
      if (idx !== -1) {
        roomWhiteboardTextItems[roomId][idx] = textItem;
      } else {
        roomWhiteboardTextItems[roomId].push(textItem);
      }
      socket.to(`room:${roomId}`).emit('whiteboard-text-item-updated', textItem);
    });

    // Whiteboard Text Item Delete Event
    socket.on('whiteboard-text-item-delete', ({ roomId, textItemId }) => {
      if (!roomId || !textItemId) return;
      if (roomWhiteboardTextItems[roomId]) {
        roomWhiteboardTextItems[roomId] = roomWhiteboardTextItems[roomId].filter(
          (t) => t.id !== textItemId
        );
      }
      socket.to(`room:${roomId}`).emit('whiteboard-text-item-deleted', { textItemId });
    });

    // Whiteboard Clear Event
    socket.on('whiteboard-clear', ({ roomId }) => {
      if (!roomId) return;
      roomWhiteboardStrokes[roomId] = [];
      roomWhiteboardTextItems[roomId] = [];
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
      socket.emit('whiteboard-history', {
        strokes: roomWhiteboardStrokes[roomId] || [],
        bgType: roomWhiteboardBg[roomId] || 'dots',
        textItems: roomWhiteboardTextItems[roomId] || [],
      });
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

    socket.on('code-language-change', ({ roomId, language, fileName, code }) => {
      if (!roomId) return;
      if (!roomCodeState[roomId]) {
        roomCodeState[roomId] = { code: code || '', language: language || 'python', fileName: fileName || 'example.py' };
      } else {
        roomCodeState[roomId].language = language;
        if (fileName) roomCodeState[roomId].fileName = fileName;
        if (code !== undefined) roomCodeState[roomId].code = code;
      }
      socket.to(`room:${roomId}`).emit('code-language-change', { language, fileName, code });
    });

    socket.on('request-code-sync', ({ roomId }) => {
      if (!roomId) return;
      socket.emit('code-sync', roomCodeState[roomId] || null);
    });

    // Collaborative Code Execution Broadcasts
    socket.on('code-execution-start', ({ roomId, runnerName }) => {
      if (!roomId) return;
      socket.to(`room:${roomId}`).emit('code-execution-start', { runnerName });
    });

    socket.on('code-execution-finish', ({ roomId, output, execTime, memUsage }) => {
      if (!roomId) return;
      socket.to(`room:${roomId}`).emit('code-execution-finish', { output, execTime, memUsage });
    });

    socket.on('code-execution-clear', ({ roomId }) => {
      if (!roomId) return;
      socket.to(`room:${roomId}`).emit('code-execution-clear');
    });

    // Real-Time Planned Session Duration & Type Sync
    socket.on('session-duration-change', ({ roomId, duration, sessionTypeLabel, updatedBy }) => {
      if (!roomId || !duration) return;
      socket.to(`room:${roomId}`).emit('session-duration-change', { duration, sessionTypeLabel, updatedBy });
    });

    // Session Ended / Concluded Broadcast
    socket.on('end-study-session', ({ roomId, reason }) => {
      if (!roomId) return;
      socket.to(`room:${roomId}`).emit('study-session-ended-by-tutor', { reason });
    });

    // ─── Real-Time Speech Recognition Transcript Relay & Storage ───
    socket.on('speech-transcript-segment', async ({ roomId, speakerId, speakerName, role, text }) => {
      if (!roomId || !text?.trim()) return;

      const timeFormatted = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const entry = {
        speakerId: speakerId || socket.id,
        speakerName: speakerName || 'Speaker',
        role: role === 'tutor' ? 'tutor' : 'student',
        text: text.trim(),
        timeFormatted,
        timestamp: new Date(),
      };

      // 1. Broadcast live transcript entry to all participants in the room
      io.to(`room:${roomId}`).emit('live-transcript-entry', entry);

      // 2. Persist to MongoDB SessionTranscript
      try {
        const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
        await SessionTranscript.findOneAndUpdate(
          { roomId },
          {
            $push: { entries: entry },
            $inc: { totalWords: wordCount },
          },
          { upsert: true, new: true }
        );
      } catch (err) {
        console.error('Failed to persist speech transcript entry:', err.message);
      }
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

    // Explicit Leave Room Event (Immediate)
    socket.on('leave-room', ({ roomId }) => {
      handleUserLeave(socket, roomId, true);
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

    // Disconnect Cleanup (Debounced 3.5s grace period for page refresh)
    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
      const roomId = socketRoomMap[socket.id];
      if (roomId) {
        handleUserLeave(socket, roomId, false);
      }
    });
  });

  function handleUserLeave(socket, roomId, immediate = false) {
    socket.leave(`room:${roomId}`);
    delete socketRoomMap[socket.id];

    if (!roomParticipants[roomId] || !roomParticipants[roomId][socket.id]) {
      return;
    }

    const leavingUser = roomParticipants[roomId][socket.id];
    delete roomParticipants[roomId][socket.id];

    const disconnectKey = `${roomId}:${leavingUser.id}`;

    const finalizeLeave = () => {
      delete disconnectTimers[disconnectKey];

      // Verify user has not reconnected under another socket before broadcasting leave
      const userStillInRoom =
        roomParticipants[roomId] &&
        Object.values(roomParticipants[roomId]).some((p) => p.id === leavingUser.id);

      if (!userStillInRoom) {
        console.log(`[Meeting Socket] ${leavingUser.name} (${leavingUser.id}) left room:${roomId}`);
        io.to(`room:${roomId}`).emit('user-left', {
          socketId: socket.id,
          userId: leavingUser.id,
        });
      }

      // If room is empty, retain whiteboard & code state for 5 minutes before cleanup
      if (roomParticipants[roomId] && Object.keys(roomParticipants[roomId]).length === 0) {
        if (!roomCleanupTimers[roomId]) {
          roomCleanupTimers[roomId] = setTimeout(() => {
            delete roomCleanupTimers[roomId];
            if (!roomParticipants[roomId] || Object.keys(roomParticipants[roomId]).length === 0) {
              console.log(`[Meeting Socket] Clearing expired memory for room:${roomId}`);
              delete roomParticipants[roomId];
              delete roomWhiteboardStrokes[roomId];
              delete roomWhiteboardBg[roomId];
              delete roomWhiteboardTextItems[roomId];
              delete roomCodeState[roomId];
              delete roomWhiteboardPermissions[roomId];
            }
          }, 300000); // 5 minutes grace
        }
      }
    };

    if (immediate) {
      if (disconnectTimers[disconnectKey]) {
        clearTimeout(disconnectTimers[disconnectKey]);
      }
      finalizeLeave();
    } else {
      // 3.5s grace period for page refresh / transient network drop
      if (disconnectTimers[disconnectKey]) {
        clearTimeout(disconnectTimers[disconnectKey]);
      }
      disconnectTimers[disconnectKey] = setTimeout(finalizeLeave, 3500);
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
