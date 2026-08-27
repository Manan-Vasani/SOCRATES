const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');
const StudyRoom = require('../models/StudyRoom');
const StudyRoomMessage = require('../models/StudyRoomMessage');
const DoubtThread = require('../models/DoubtThread');
const Booking = require('../models/Booking');
const User = require('../models/User');
const SessionTranscript = require('../models/SessionTranscript');

/**
 * Helper to check whether a user is authorized to join a study session / tutoring room.
 */
async function verifySessionAuthorization(room, reqUser, roomIdOrMeetingId) {
  // Try finding associated booking record
  let booking = null;
  if (roomIdOrMeetingId) {
    booking = await Booking.findOne({
      $or: [
        { meetingId: roomIdOrMeetingId },
        ...(mongoose.Types.ObjectId.isValid(roomIdOrMeetingId) ? [{ _id: roomIdOrMeetingId }] : []),
      ],
    }).catch(() => null);
  }

  const isTutoringSession =
    !!booking ||
    (roomIdOrMeetingId && roomIdOrMeetingId.startsWith('sess-')) ||
    (room && (room.subject === '1-on-1 Tutoring' || room.isPrivate));

  // Generic public community rooms are accessible to logged-in or guest users
  if (!isTutoringSession) {
    return {
      isAuthorized: true,
      isTutoringSession: false,
      reason: 'PUBLIC_ROOM',
    };
  }

  // Demo initial sessions support (sess-101, sess-102, sess-103, demo-101) and test rooms for testing & guest learners
  if (
    ['sess-101', 'sess-102', 'sess-103', 'demo-101'].includes(roomIdOrMeetingId) ||
    (roomIdOrMeetingId && (roomIdOrMeetingId.startsWith('test-') || roomIdOrMeetingId.startsWith('room-')))
  ) {
    return {
      isAuthorized: true,
      isTutoringSession: true,
      role: reqUser?.role === 'tutor' ? 'tutor' : 'student',
    };
  }

  // Tutoring sessions strictly require authentication
  if (!reqUser) {
    return {
      isAuthorized: false,
      isTutoringSession: true,
      reason: 'REQUIRES_AUTHENTICATION',
      message: 'Access restricted. Please sign in with the student account that booked this tutoring session.',
    };
  }

  const userIdStr = reqUser._id ? reqUser._id.toString() : '';
  const userNameStr = (reqUser.fullName || reqUser.name || '').trim().toLowerCase();
  const userEmailStr = (reqUser.email || '').trim().toLowerCase();

  // Check booking ownership if booking record exists
  if (booking) {
    const isBookedStudent =
      (booking.studentId && booking.studentId.toString() === userIdStr) ||
      (booking.studentName && booking.studentName.trim().toLowerCase() === userNameStr) ||
      (booking.studentEmail && booking.studentEmail.trim().toLowerCase() === userEmailStr);

    const isAssignedTutor =
      booking.tutorId === userIdStr ||
      (booking.tutorEmail && booking.tutorEmail.trim().toLowerCase() === userEmailStr) ||
      (room?.host && (room.host._id || room.host).toString() === userIdStr);

    const isPeerLearner =
      Array.isArray(booking.participants) &&
      booking.participants.some(
        (p) =>
          (p.studentId && p.studentId.toString() === userIdStr) ||
          (p.studentEmail && p.studentEmail.trim().toLowerCase() === userEmailStr) ||
          (p.studentName && p.studentName.trim().toLowerCase() === userNameStr)
      );

    if (isBookedStudent || isAssignedTutor || isPeerLearner) {
      return {
        isAuthorized: true,
        isTutoringSession: true,
        role: isAssignedTutor ? 'tutor' : isBookedStudent ? 'student' : 'student',
        participantType: isAssignedTutor ? 'tutor' : isBookedStudent ? 'host' : 'peer',
        studentName: booking.studentName,
      };
    }

    return {
      isAuthorized: false,
      isTutoringSession: true,
      reason: 'UNAUTHORIZED_STUDENT_ONLY',
      message: `Access denied. This tutoring session was booked by ${booking.studentName}. Only ${booking.studentName}, enrolled peer learners, and their tutor are authorized to join.`,
    };
  }

  // Fallback for private / host rooms in StudyRoom collection
  if (room && room.host) {
    const isHost = (room.host._id || room.host).toString() === userIdStr;
    const isParticipant =
      room.participants &&
      room.participants.some((p) => (p.user?._id || p.user).toString() === userIdStr);

    if (isHost || isParticipant) {
      return {
        isAuthorized: true,
        isTutoringSession: true,
        role: isHost ? 'tutor' : 'student',
      };
    }
  }

  // Demo initial sessions support (sess-101, sess-102, sess-103, demo-101) and test rooms for development/testing
  if (
    ['sess-101', 'sess-102', 'sess-103', 'demo-101'].includes(roomIdOrMeetingId) ||
    roomIdOrMeetingId.startsWith('test-') ||
    roomIdOrMeetingId.startsWith('room-')
  ) {
    return {
      isAuthorized: true,
      isTutoringSession: true,
      role: reqUser?.role === 'tutor' ? 'tutor' : 'student',
    };
  }

  // Default for unrecognized or unauthorized tutoring links: DENY access
  return {
    isAuthorized: false,
    isTutoringSession: true,
    reason: 'UNAUTHORIZED_SESSION_LINK',
    message: 'Access denied. You do not have an active booking authorization for this tutoring session.',
  };
}

/**
 * GET /api/v1/study-rooms
 * List active study rooms with optional filters
 */
exports.getRooms = async (req, res) => {
  const { page = 1, limit = 20, subject, tag, search } = req.query;

  const query = { status: 'active' };

  if (subject && subject !== 'All') query.subject = subject;
  if (tag && tag !== 'All') query.tag = tag;
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { subject: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [rooms, total] = await Promise.all([
    StudyRoom.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('host', 'fullName profileImage')
      .populate('participants.user', 'fullName profileImage')
      .lean(),
    StudyRoom.countDocuments(query),
  ]);

  // Add activeMembers count to each room
  const roomsWithCount = rooms.map((r) => ({
    ...r,
    activeMembers: r.participants ? r.participants.length : 0,
  }));

  res.json({
    success: true,
    data: roomsWithCount,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
};

/**
 * POST /api/v1/study-rooms
 * Create a new study room
 */
exports.createRoom = async (req, res) => {
  const {
    title,
    subject,
    description,
    maxCapacity,
    tag,
    isPrivate,
    accessCode,
    meetingId,
  } = req.body;

  const finalMeetingId = meetingId || `mtg-${uuidv4().slice(0, 8)}`;
  const jitsiRoomName = `socrates-${uuidv4().slice(0, 8)}-${Date.now().toString(36)}`;

  const room = await StudyRoom.create({
    title,
    subject,
    description: description || '',
    host: req.user._id,
    participants: [
      {
        user: req.user._id,
        role: 'host',
        joinedAt: new Date(),
      },
    ],
    maxCapacity: maxCapacity || 10,
    tag: tag || 'Public',
    isPrivate: !!isPrivate,
    accessCode: isPrivate ? accessCode : null,
    meetingId: finalMeetingId,
    jitsiRoomName,
    status: 'active',
  });

  await room.populate('host', 'fullName profileImage');
  await room.populate('participants.user', 'fullName profileImage');

  // Create system message for room creation
  await StudyRoomMessage.create({
    room: room._id,
    sender: req.user._id,
    text: `${req.user.fullName} created the study room.`,
    type: 'system',
  });

  // Emit real-time event
  const io = req.app.get('io');
  if (io) {
    io.of('/study-room').emit('room-created', {
      ...room.toObject(),
      activeMembers: 1,
    });
  }

  res.status(201).json({ success: true, data: room });
};

/**
 * GET /api/v1/study-rooms/:id
 * Get room details + participants with authorization check
 */
exports.getRoom = async (req, res) => {
  const roomIdOrMeetingId = req.params.id;
  const isMongoId = mongoose.Types.ObjectId.isValid(roomIdOrMeetingId);

  let room = await StudyRoom.findOne({
    $or: [
      ...(isMongoId ? [{ _id: roomIdOrMeetingId }] : []),
      { meetingId: roomIdOrMeetingId },
      { jitsiRoomName: roomIdOrMeetingId },
    ],
  })
    .populate('host', 'fullName profileImage role')
    .populate('participants.user', 'fullName profileImage role')
    .populate('linkedThread', 'title subject');

  // Fallback for custom shareable meeting links (e.g., /meeting/sess-abc123xyz)
  if (!room) {
    const booking = await Booking.findOne({
      $or: [
        { meetingId: roomIdOrMeetingId },
        ...(isMongoId ? [{ _id: roomIdOrMeetingId }] : []),
      ],
    }).lean().catch(() => null);

    room = {
      _id: roomIdOrMeetingId,
      meetingId: roomIdOrMeetingId,
      title: booking
        ? `${booking.subject} with ${booking.tutorName || 'Tutor'}`
        : `Study Session (${roomIdOrMeetingId})`,
      subject: booking?.subject || (roomIdOrMeetingId.startsWith('sess-') ? '1-on-1 Tutoring' : 'Tutoring Session'),
      topic: booking?.topic || 'Live Interactive Tutoring',
      description: booking?.topic || 'Live 1-on-1 / Group Tutoring Meeting',
      tutorName: booking?.tutorName || '',
      studentName: booking?.studentName || '',
      dateStr: booking?.date || '',
      timeStr: booking?.time || '',
      duration: booking?.duration || 60,
      fee: booking?.fee || 0,
      isGroupSession: booking?.isGroupSession || false,
      participants: (booking?.participants || []).map((p) => ({
        user: {
          _id: p.studentId,
          fullName: p.studentName,
          email: p.studentEmail,
        },
        role: 'member',
        joinedAt: p.joinedAt,
      })),
      status: booking?.status === 'cancelled' ? 'ended' : 'active',
      maxCapacity: booking?.isGroupSession ? 10 : 2,
      isPrivate: true,
      booking: booking || null,
    };
  }

  const auth = await verifySessionAuthorization(room, req.user, roomIdOrMeetingId);

  res.json({
    success: true,
    data: {
      ...room.toObject ? room.toObject() : room,
      authorization: auth,
    },
  });
};

/**
 * POST /api/v1/study-rooms/:id/join
 * Join a study room
 */
exports.joinRoom = async (req, res) => {
  const room = await StudyRoom.findById(req.params.id);

  if (!room) {
    return res.status(404).json({ success: false, message: 'Study room not found' });
  }

  if (room.status !== 'active') {
    return res.status(400).json({ success: false, message: 'This study room has ended' });
  }

  // Check user session authorization (booked student & assigned tutor only for tutoring rooms)
  const auth = await verifySessionAuthorization(room, req.user, req.params.id);
  if (!auth.isAuthorized) {
    return res.status(403).json({
      success: false,
      message: auth.message || 'Only the student who booked this session and the assigned tutor are authorized to join.',
      reason: auth.reason,
    });
  }

  // Check capacity
  if (room.participants.length >= room.maxCapacity) {
    return res.status(400).json({ success: false, message: 'Study room is at full capacity' });
  }

  // Check if already in room
  const alreadyJoined = room.participants.some(
    (p) => p.user.toString() === req.user._id.toString()
  );

  if (alreadyJoined) {
    await room.populate('participants.user', 'fullName profileImage');
    return res.json({ success: true, data: room, reconnected: true });
  }

  // Validate access code for private rooms
  if (room.isPrivate && room.accessCode) {
    const { accessCode } = req.body;
    if (accessCode !== room.accessCode) {
      return res.status(403).json({ success: false, message: 'Invalid access code' });
    }
  }

  room.participants.push({
    user: req.user._id,
    role: 'member',
    joinedAt: new Date(),
  });

  await room.save();

  // Create system message
  await StudyRoomMessage.create({
    room: room._id,
    sender: req.user._id,
    text: `${req.user.fullName} joined the room.`,
    type: 'system',
  });

  // Emit real-time event
  const io = req.app.get('io');
  if (io) {
    io.of('/study-room').to(`room:${room._id}`).emit('participant-joined', {
      roomId: room._id,
      participant: {
        user: {
          _id: req.user._id,
          fullName: req.user.fullName,
          profileImage: req.user.profileImage,
        },
        role: 'member',
        joinedAt: new Date(),
      },
      activeMembers: room.participants.length,
    });
  }

  await room.populate('participants.user', 'fullName profileImage');

  res.json({ success: true, data: room });
};

/**
 * POST /api/v1/study-rooms/:id/leave
 * Leave a study room
 */
exports.leaveRoom = async (req, res) => {
  const room = await StudyRoom.findById(req.params.id);

  if (!room) {
    return res.status(404).json({ success: false, message: 'Study room not found' });
  }

  const userId = req.user._id.toString();
  const participantIndex = room.participants.findIndex(
    (p) => p.user.toString() === userId
  );

  if (participantIndex === -1) {
    return res.status(400).json({ success: false, message: 'You are not in this room' });
  }

  room.participants.splice(participantIndex, 1);

  // Create system message
  await StudyRoomMessage.create({
    room: room._id,
    sender: req.user._id,
    text: `${req.user.fullName} left the room.`,
    type: 'system',
  });

  // If the host left and room is empty, end the room
  if (room.participants.length === 0) {
    room.status = 'ended';
    room.endedAt = new Date();
  } else if (room.host.toString() === userId) {
    // Transfer host to first remaining participant
    room.host = room.participants[0].user;
    room.participants[0].role = 'host';
  }

  await room.save();

  // Emit real-time event
  const io = req.app.get('io');
  if (io) {
    io.of('/study-room').to(`room:${room._id}`).emit('participant-left', {
      roomId: room._id,
      userId,
      activeMembers: room.participants.length,
    });

    if (room.status === 'ended') {
      io.of('/study-room').to(`room:${room._id}`).emit('room-ended', {
        roomId: room._id,
      });
    }
  }

  res.json({ success: true, message: 'Left the room' });
};

const sendEmail = require('../utils/sendEmail');
const { buildSessionRecapEmail } = require('../utils/bookingEmails');
const axios = require('axios');

/**
 * POST /api/v1/study-rooms/:id/end
 * End a study room (host or assigned tutor) & dispatch session recap emails
 */
exports.endRoom = async (req, res) => {
  const roomIdOrMeetingId = req.params.id;
  const isMongoId = mongoose.Types.ObjectId.isValid(roomIdOrMeetingId);

  let room = await StudyRoom.findOne({
    $or: [
      ...(isMongoId ? [{ _id: roomIdOrMeetingId }] : []),
      { meetingId: roomIdOrMeetingId },
      { jitsiRoomName: roomIdOrMeetingId },
    ],
  });

  const booking = await Booking.findOne({
    $or: [
      { meetingId: roomIdOrMeetingId },
      ...(isMongoId ? [{ _id: roomIdOrMeetingId }] : []),
    ],
  }).catch(() => null);

  const userIdStr = req.user._id ? req.user._id.toString() : '';
  const isHost = room && (room.host.toString() === userIdStr);
  const isTutor = booking && (booking.tutorId === userIdStr || (booking.tutorEmail && booking.tutorEmail.toLowerCase() === req.user.email?.toLowerCase()));
  const isAdmin = req.user.role === 'admin';

  if (!isHost && !isTutor && !isAdmin && room) {
    return res.status(403).json({ success: false, message: 'Only the host or tutor can end this room' });
  }

  if (room) {
    room.status = 'ended';
    room.endedAt = new Date();
    await room.save();

    // Create system message
    await StudyRoomMessage.create({
      room: room._id,
      sender: req.user._id,
      text: `${req.user.fullName} ended the study session.`,
      type: 'system',
    });

    // Emit real-time event
    const io = req.app.get('io');
    if (io) {
      io.of('/study-room').to(`room:${room._id}`).emit('room-ended', {
        roomId: room._id,
      });
      io.of('/study-room').to(`room:${roomIdOrMeetingId}`).emit('room-ended', {
        roomId: roomIdOrMeetingId,
      });
    }
  }

  // Calculate metrics
  const sessionTargetId = room?._id || (isMongoId ? roomIdOrMeetingId : null);
  let messageCount = 0;
  if (sessionTargetId) {
    messageCount = await StudyRoomMessage.countDocuments({ room: sessionTargetId }).catch(() => 0);
  }

  const durationMinutes = room?.createdAt
    ? Math.max(1, Math.round((new Date() - new Date(room.createdAt)) / 60000))
    : booking?.duration || 60;

  // Dispatch session recap emails to tutor, primary student, and peer participants
  if (booking) {
    try {
      const allRecipients = [
        {
          name: booking.tutorName || 'Tutor',
          email: booking.tutorEmail,
          role: 'tutor',
        },
        {
          name: booking.studentName || 'Student',
          email: booking.studentEmail,
          role: 'student',
        },
        ...(Array.isArray(booking.participants)
          ? booking.participants.map((p) => ({
              name: p.studentName || 'Student',
              email: p.studentEmail,
              role: 'student',
            }))
          : []),
      ].filter((r) => r.email && r.email.trim());

      // Deduplicate by email
      const uniqueRecipients = Array.from(
        new Map(allRecipients.map((r) => [r.email.toLowerCase(), r])).values()
      );

      const totalParticipants = uniqueRecipients.filter((r) => r.role === 'student').length || 1;

      for (const recipient of uniqueRecipients) {
        const recapHtml = buildSessionRecapEmail({
          recipientName: recipient.name,
          tutorName: booking.tutorName,
          studentName: booking.studentName,
          subject: booking.subject || 'Study Session',
          topic: booking.topic || 'Tutoring Practice',
          durationMinutes,
          messageCount,
          meetingId: booking.meetingId || roomIdOrMeetingId,
          isGroupSession: !!booking.isGroupSession,
          totalParticipants,
        });

        sendEmail({
          to: recipient.email,
          subject: `Session Recap: ${booking.subject || 'Study Session'} — SOCRATES`,
          html: recapHtml,
        }).catch((err) => {
          console.error(`[Recap Email Error] Failed to send recap to ${recipient.email}:`, err.message);
        });
      }
    } catch (emailErr) {
      console.error('[Recap Email Error]', emailErr.message);
    }
  }

  res.json({ success: true, message: 'Room ended successfully and recaps dispatched.' });
};

/**
 * GET /api/v1/study-rooms/:id/messages
 * Get room chat history (paginated)
 */
exports.getMessages = async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const roomIdOrMeetingId = req.params.id;
  const isMongoId = mongoose.Types.ObjectId.isValid(roomIdOrMeetingId);

  let targetRoomId = roomIdOrMeetingId;
  if (!isMongoId) {
    const roomDoc = await StudyRoom.findOne({
      $or: [{ meetingId: roomIdOrMeetingId }, { jitsiRoomName: roomIdOrMeetingId }],
    }).select('_id');
    if (roomDoc) {
      targetRoomId = roomDoc._id;
    }
  }

  const [messages, total] = await Promise.all([
    StudyRoomMessage.find({ room: targetRoomId })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('sender', 'fullName profileImage role')
      .lean(),
    StudyRoomMessage.countDocuments({ room: targetRoomId }),
  ]);

  res.json({
    success: true,
    data: messages,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
};

/**
 * GET /api/v1/study-rooms/:id/transcript
 * Get room spoken dialogue transcript
 */
exports.getTranscript = async (req, res) => {
  const roomIdOrMeetingId = req.params.id;

  try {
    const transcriptDoc = await SessionTranscript.findOne({ roomId: roomIdOrMeetingId })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: transcriptDoc ? transcriptDoc.entries : [],
      summary: transcriptDoc?.summary || '',
      totalWords: transcriptDoc?.totalWords || 0,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to load session transcript',
      error: error.message,
    });
  }
};

/**
 * POST /api/v1/study-rooms/:id/ai-copilot
 * In-Room Socrates AI Copilot Endpoint
 */
exports.aiCopilot = async (req, res) => {
  const { prompt, quickAction, currentCode, activeTopic } = req.body;
  const questionText = (prompt || '').trim();

  if (!questionText && !quickAction) {
    return res.status(400).json({ success: false, message: 'Prompt or quickAction is required.' });
  }

  const FASTAPI_SERVICE_URL = process.env.FASTAPI_SERVICE_URL || 'http://localhost:8000';

  try {
    const response = await axios.post(
      `${FASTAPI_SERVICE_URL}/api/v1/ai/tutor/query`,
      {
        question: questionText || quickAction,
        student_id: req.user?._id?.toString() || 'guest-student',
        subject: activeTopic || 'General Tutoring',
        code_snippet: currentCode || '',
        action: quickAction || null,
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000,
      }
    );

    if (response.data && (response.data.answer || response.data.response)) {
      return res.json({
        success: true,
        data: {
          response: response.data.answer || response.data.response,
        },
      });
    }
  } catch (err) {
    console.warn('[AI Microservice Offline/Fallback]', err.message);
  }

  // Socratic intelligent fallback response generator
  let fallbackAnswer = '';

  if (quickAction === 'Explain Formula' || questionText.toLowerCase().includes('formula')) {
    fallbackAnswer = `**Socratic Formula Derivation & Breakdown**\n\n**Core Insight:**\nWhen analyzing mathematical formulas, identify each variable's dimension and behavioral limits.\n\n**Step 1:** Isolate the dependent variables and boundary conditions.\n**Step 2:** Apply differential or algebraic identities step-by-step.\n**Step 3:** Verify dimensional consistency.\n\n*Question for you:* Which specific variable in this expression is changing relative to the others?`;
  } else if (quickAction === 'Debug Code' || currentCode) {
    fallbackAnswer = `**Socratic Code Analysis**\n\nI reviewed your code snippet:\n\`\`\`\n${(currentCode || questionText).slice(0, 300)}\n\`\`\`\n\n**Key Observations:**\n1. **State & Bounds:** Check whether loop indices or edge cases (empty list, null inputs) are handled properly.\n2. **Type Safety:** Ensure the return value matches the expected caller signature.\n\n*Guided Question:* What output do you expect when the input is 0 or empty? Trace that path line by line.`;
  } else if (quickAction === 'Summarize Session') {
    fallbackAnswer = `**Study Session Summary**\n\n**Topic:** ${activeTopic || 'Live Tutoring Session'}\n\n**Key Focus Points:**\n- Clarified core concepts and algorithmic foundations.\n- Worked through live interactive examples on the Whiteboard and Code Sandbox.\n- Validated problem-solving strategies collaboratively.\n\n**Next Steps:** Review your notes and practice 2-3 similar problems to solidify understanding.`;
  } else if (quickAction === 'Practice Quiz') {
    fallbackAnswer = `**Practice Quiz — ${activeTopic || 'Concept Mastery'}**\n\n1. What is the primary invariant or condition that must hold true in this problem?\n2. How would the complexity change if the input size doubled?\n3. Can you describe an edge case that could break the naive approach?`;
  } else {
    fallbackAnswer = `**Socratic AI Response**\n\nThat's a thoughtful question regarding **${activeTopic || 'this concept'}**.\n\nTo explore this deeply:\n1. What is the fundamental principle governing this system?\n2. If we simplify the problem to its simplest non-trivial case, what pattern emerges?\n\nTake a moment to reason through the first step on the Whiteboard or in code, and let's verify together!`;
  }

  return res.json({
    success: true,
    data: {
      response: fallbackAnswer,
      isFallback: true,
    },
  });
};

/**
 * POST /api/v1/study-rooms/from-thread/:threadId
 * Create a study room linked to a doubt thread
 */
exports.createRoomFromThread = async (req, res) => {
  const thread = await DoubtThread.findById(req.params.threadId);

  if (!thread) {
    return res.status(404).json({ success: false, message: 'Thread not found' });
  }

  const jitsiRoomName = `socrates-thread-${req.params.threadId.slice(-6)}-${uuidv4().slice(0, 6)}`;

  const room = await StudyRoom.create({
    title: `Study Room: ${thread.title.slice(0, 60)}`,
    subject: thread.subject,
    description: `Discussing: ${thread.title}`,
    host: req.user._id,
    participants: [
      {
        user: req.user._id,
        role: 'host',
        joinedAt: new Date(),
      },
    ],
    maxCapacity: 8,
    tag: 'Public',
    isPrivate: false,
    linkedThread: thread._id,
    jitsiRoomName,
    status: 'active',
  });

  await room.populate('host', 'fullName profileImage');
  await room.populate('participants.user', 'fullName profileImage');

  // Create system message
  await StudyRoomMessage.create({
    room: room._id,
    sender: req.user._id,
    text: `${req.user.fullName} started a study room from the doubt thread "${thread.title}".`,
    type: 'system',
  });

  // Emit real-time event
  const io = req.app.get('io');
  if (io) {
    io.of('/study-room').emit('room-created', {
      ...room.toObject(),
      activeMembers: 1,
    });
  }

  res.status(201).json({ success: true, data: room });
};
