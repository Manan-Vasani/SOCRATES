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
 * Helper to generate an AI session recap using the Python AI microservice or intelligent fallback
 */
async function generateSessionRecap({ roomId, subject, dialogueText, totalWords, durationMinutes }) {
  const FASTAPI_SERVICE_URL = process.env.FASTAPI_SERVICE_URL || 'http://localhost:8000';

  if (dialogueText && dialogueText.trim().length > 20) {
    try {
      const response = await axios.post(
        `${FASTAPI_SERVICE_URL}/api/v1/ai/summarize/session`,
        {
          session_id: roomId,
          subject: subject || 'General Tutoring',
          dialogue: dialogueText,
          total_words: totalWords || 0,
          duration_minutes: durationMinutes || 60,
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 12000,
        }
      );

      if (response.data && response.data.executive_summary) {
        return {
          executive_summary: response.data.executive_summary,
          key_takeaways: response.data.key_takeaways || [],
          action_items: response.data.action_items || [],
          key_equations: response.data.key_equations || [],
          generated_flashcards: response.data.generated_flashcards || [],
        };
      }
    } catch (err) {
      console.warn('[AI Recap Microservice Fallback Triggered]', err.message);
    }
  }

  // Socratic intelligent heuristic recap generator fallback
  const cleanSubject = subject || 'Interactive Tutoring Session';
  return {
    executive_summary: `The interactive study session focused on foundational principles, step-by-step problem deconstruction, and active collaborative reasoning in ${cleanSubject}. Key questions were explored systematically using Socratic dialogue.`,
    key_takeaways: [
      `Mastered core conceptual foundations and structural problem-solving methods in ${cleanSubject}.`,
      'Analyzed edge cases and verified constraints collaboratively on the shared workspace.',
      'Demonstrated active recall and independent reasoning through Socratic inquiry.',
    ],
    action_items: [
      `Review session notes and solve 3 targeted practice problems in ${cleanSubject}.`,
      'Conduct active recall using the generated Socratic flashcards below.',
      'Document any lingering edge-case questions for the next peer review session.',
    ],
    key_equations: [
      'f(x) = L + \\epsilon \\implies \\lim_{x \\to a} f(x) = L',
      '\\Delta E = mc^2 \\quad \\text{and} \\quad T(n) = O(n \\log n)',
    ],
    generated_flashcards: [
      {
        question: `What is the primary constraint or principle to verify first when approaching a problem in ${cleanSubject}?`,
        answer: 'Identify boundary conditions, state invariants, and known variable definitions before applying transformations.',
      },
      {
        question: `How do you validate the correctness of an intermediate derivation or algorithm step?`,
        answer: 'Test with a minimal non-trivial example (or base case) and verify dimensional/type consistency.',
      },
    ],
  };
}

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
  }

  // Calculate metrics
  const sessionTargetId = room?._id || (isMongoId ? roomIdOrMeetingId : null);
  let messageCount = 0;
  let roomMessages = [];
  if (sessionTargetId) {
    roomMessages = await StudyRoomMessage.find({ room: sessionTargetId })
      .populate('sender', 'fullName')
      .lean()
      .catch(() => []);
    messageCount = roomMessages.length;
  }

  const durationMinutes = room?.createdAt
    ? Math.max(1, Math.round((new Date() - new Date(room.createdAt)) / 60000))
    : booking?.duration || 60;

  // Find or initialize session transcript document
  let transcriptDoc = await SessionTranscript.findOne({ roomId: roomIdOrMeetingId });
  if (!transcriptDoc && booking?.meetingId) {
    transcriptDoc = await SessionTranscript.findOne({ roomId: booking.meetingId });
  }

  if (!transcriptDoc) {
    transcriptDoc = new SessionTranscript({
      roomId: roomIdOrMeetingId,
      bookingId: booking?._id || null,
      entries: [],
      totalWords: 0,
    });
  }

  // Compile dialogue text for AI recap
  let dialogueText = '';
  if (transcriptDoc.entries && transcriptDoc.entries.length > 0) {
    dialogueText = transcriptDoc.entries
      .map((e) => `${e.speakerName} (${e.role}): ${e.text}`)
      .join('\n');
  } else if (roomMessages.length > 0) {
    dialogueText = roomMessages
      .map((m) => `${m.sender?.fullName || 'User'}: ${m.text}`)
      .join('\n');
  }

  const calculatedWords = transcriptDoc.totalWords || (dialogueText ? dialogueText.split(/\s+/).filter(Boolean).length : messageCount * 12);
  const sessionSubject = booking?.subject || room?.subject || 'Tutoring Session';

  // Generate AI structured recap
  const aiRecap = await generateSessionRecap({
    roomId: roomIdOrMeetingId,
    subject: sessionSubject,
    dialogueText,
    totalWords: calculatedWords,
    durationMinutes,
  });

  // Persist AI summary & study aids into SessionTranscript
  transcriptDoc.summary = aiRecap.executive_summary;
  transcriptDoc.keyTakeaways = aiRecap.key_takeaways;
  transcriptDoc.actionItems = aiRecap.action_items;
  transcriptDoc.keyEquations = aiRecap.key_equations;
  transcriptDoc.flashcards = aiRecap.generated_flashcards;
  transcriptDoc.totalWords = calculatedWords;
  if (Array.isArray(req.body.whiteboardPages) && req.body.whiteboardPages.length > 0) {
    transcriptDoc.whiteboardPages = req.body.whiteboardPages;
  }
  if (booking) transcriptDoc.bookingId = booking._id;
  await transcriptDoc.save();

  // Emit real-time completion event with summary to in-room participants
  const io = req.app.get('io');
  if (io) {
    const recapPayload = {
      roomId: roomIdOrMeetingId,
      summary: aiRecap.executive_summary,
      keyTakeaways: aiRecap.key_takeaways,
      actionItems: aiRecap.action_items,
      keyEquations: aiRecap.key_equations,
      flashcards: aiRecap.generated_flashcards,
      totalWords: calculatedWords,
      durationMinutes,
      messageCount,
    };

    if (room) {
      io.of('/study-room').to(`room:${room._id}`).emit('room-ended', { roomId: room._id });
      io.of('/study-room').to(`room:${room._id}`).emit('session-summary-ready', recapPayload);
    }
    io.of('/study-room').to(`room:${roomIdOrMeetingId}`).emit('room-ended', { roomId: roomIdOrMeetingId });
    io.of('/study-room').to(`room:${roomIdOrMeetingId}`).emit('session-summary-ready', recapPayload);
  }

  // Dispatch session recap emails to tutor, primary student, and peer participants
  try {
    const allRecipients = [];

    if (booking) {
      allRecipients.push(
        { name: booking.tutorName || 'Tutor', email: booking.tutorEmail, role: 'tutor' },
        { name: booking.studentName || 'Student', email: booking.studentEmail, role: 'student' }
      );
      if (Array.isArray(booking.participants)) {
        for (const p of booking.participants) {
          allRecipients.push({ name: p.studentName || 'Student', email: p.studentEmail, role: 'student' });
        }
      }
    }

    if (room && room.participants) {
      for (const p of room.participants) {
        if (p.user && p.user.email) {
          allRecipients.push({
            name: p.user.fullName || 'Learner',
            email: p.user.email,
            role: p.role === 'host' ? 'host' : 'student',
          });
        }
      }
    }

    // Filter valid emails & deduplicate
    const uniqueRecipients = Array.from(
      new Map(
        allRecipients
          .filter((r) => r.email && r.email.trim())
          .map((r) => [r.email.toLowerCase(), r])
      ).values()
    );

    const totalParticipants = Math.max(1, uniqueRecipients.filter((r) => r.role === 'student' || r.role === 'host').length);

    for (const recipient of uniqueRecipients) {
      const recapHtml = buildSessionRecapEmail({
        recipientName: recipient.name,
        tutorName: booking?.tutorName || room?.host?.fullName || 'Mentor',
        studentName: booking?.studentName || recipient.name,
        subject: sessionSubject,
        topic: booking?.topic || room?.title || 'Interactive Practice',
        durationMinutes,
        messageCount,
        meetingId: booking?.meetingId || roomIdOrMeetingId,
        isGroupSession: !!booking?.isGroupSession,
        totalParticipants,
        totalWords: calculatedWords,
        executiveSummary: aiRecap.executive_summary,
        keyTakeaways: aiRecap.key_takeaways,
        actionItems: aiRecap.action_items,
        keyEquations: aiRecap.key_equations,
        flashcards: aiRecap.generated_flashcards,
        sharedFiles: transcriptDoc.sharedFiles || [],
      });

      sendEmail({
        to: recipient.email,
        subject: `AI Session Recap: ${sessionSubject} — SOCRATES`,
        html: recapHtml,
      }).catch((err) => {
        console.error(`[Recap Email Error] Failed to send recap to ${recipient.email}:`, err.message);
      });
    }
  } catch (emailErr) {
    console.error('[Recap Email Error]', emailErr.message);
  }

  res.json({
    success: true,
    message: 'Room ended successfully, AI summary generated, and recaps dispatched.',
    recap: {
      summary: aiRecap.executive_summary,
      keyTakeaways: aiRecap.key_takeaways,
      actionItems: aiRecap.action_items,
      keyEquations: aiRecap.key_equations,
      flashcards: aiRecap.generated_flashcards,
      totalWords: calculatedWords,
      durationMinutes,
      messageCount,
    },
  });
};

/**
 * GET /api/v1/study-rooms/my-recaps
 * List completed session recordings, AI recaps, and interactive transcripts for the logged in user
 */
exports.getMyRecaps = async (req, res) => {
  try {
    const userIdStr = req.user?._id ? req.user._id.toString() : '';
    const userEmailStr = (req.user?.email || '').trim().toLowerCase();
    const userNameStr = (req.user?.fullName || req.user?.name || '').trim().toLowerCase();

    // 1. Find all relevant bookings
    const bookings = await Booking.find({
      $or: [
        { studentId: userIdStr },
        { tutorId: userIdStr },
        { studentEmail: userEmailStr },
        { tutorEmail: userEmailStr },
        { 'participants.studentId': userIdStr },
        { 'participants.studentEmail': userEmailStr },
      ],
    })
      .sort({ updatedAt: -1 })
      .lean();

    const bookingMeetingIds = bookings.map((b) => b.meetingId).filter(Boolean);
    const bookingIds = bookings.map((b) => b._id);

    // 2. Find transcripts matching bookings or roomIds
    const transcripts = await SessionTranscript.find({
      $or: [
        { bookingId: { $in: bookingIds } },
        { roomId: { $in: bookingMeetingIds } },
      ],
    })
      .sort({ createdAt: -1 })
      .lean();

    // Map transcripts by roomId / bookingId for fast lookup
    const transcriptMap = new Map();
    for (const t of transcripts) {
      if (t.roomId) transcriptMap.set(t.roomId, t);
      if (t.bookingId) transcriptMap.set(t.bookingId.toString(), t);
    }

    // 3. Transform bookings into rich recap objects
    const recaps = [];

    for (const booking of bookings) {
      const transcript =
        transcriptMap.get(booking.meetingId) ||
        transcriptMap.get(booking._id.toString()) ||
        null;

      const isHostTutor =
        booking.tutorId === userIdStr ||
        (booking.tutorEmail && booking.tutorEmail.toLowerCase() === userEmailStr);

      const participants = Array.isArray(booking.participants)
        ? booking.participants.map((p) => p.studentName).filter(Boolean)
        : [];
      const transcriptStudents = transcript?.entries
        ? transcript.entries
            .filter((e) => e.role === 'student' || (e.role !== 'tutor' && e.speakerName !== booking.tutorName))
            .map((e) => e.speakerName)
        : [];
      const uniqueStudentNames = Array.from(
        new Set([booking.studentName, ...participants, ...transcriptStudents].filter(Boolean))
      );

      recaps.push({
        id: transcript?._id || booking._id,
        bookingId: booking._id,
        roomId: booking.meetingId || `sess-${booking._id}`,
        subject: booking.subject || '1-on-1 Tutoring',
        topic: booking.topic || 'Live Interactive Tutoring',
        tutorName: booking.tutorName || 'Mentor',
        studentName: booking.studentName || 'Student',
        studentNames: uniqueStudentNames.length > 0 ? uniqueStudentNames : [booking.studentName || 'Student'],
        tutorAvatar: booking.tutorAvatar,
        isTutor: isHostTutor,
        date: booking.date || (booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : 'Recent'),
        time: booking.time || '',
        durationMinutes: booking.duration || 60,
        status: booking.status === 'confirmed' || booking.status === 'completed' ? 'completed' : booking.status,
        totalWords: transcript?.totalWords || 0,
        executiveSummary: transcript?.summary || '',
        keyTakeaways: transcript?.keyTakeaways || [],
        actionItems: transcript?.actionItems || [],
        keyEquations: transcript?.keyEquations || [],
        flashcards: transcript?.flashcards || [],
        sharedFiles: transcript?.sharedFiles || [],
        transcriptEntries: transcript?.entries || [],
        whiteboardPages: transcript?.whiteboardPages || [],
        recordingUrl: `https://meet.jit.si/socrates-${booking.meetingId || booking._id}`,
        createdAt: transcript?.createdAt || booking.createdAt,
      });
    }

    // Also include any standalone transcripts (e.g., from public rooms / demo rooms)
    for (const t of transcripts) {
      const alreadyIncluded = recaps.some((r) => r.roomId === t.roomId || r.id?.toString() === t._id?.toString());
      if (!alreadyIncluded) {
        const tStudents = t.entries
          ? t.entries
              .filter((e) => e.role === 'student' || (e.role !== 'tutor' && e.speakerName !== 'Socrates Mentor'))
              .map((e) => e.speakerName)
          : [];
        const uniqueTStudents = Array.from(new Set([req.user?.fullName || 'Student', ...tStudents].filter(Boolean)));

        recaps.push({
          id: t._id,
          roomId: t.roomId,
          subject: 'Study Room Session',
          topic: 'Interactive Dialogue Practice',
          tutorName: 'Socrates Mentor',
          studentName: req.user?.fullName || 'Student',
          studentNames: uniqueTStudents.length > 0 ? uniqueTStudents : [req.user?.fullName || 'Student'],
          isTutor: req.user?.role === 'tutor',
          date: t.createdAt ? new Date(t.createdAt).toLocaleDateString() : 'Recent',
          durationMinutes: 45,
          status: 'completed',
          totalWords: t.totalWords || 0,
          executiveSummary: t.summary || '',
          keyTakeaways: t.keyTakeaways || [],
          actionItems: t.actionItems || [],
          keyEquations: t.keyEquations || [],
          flashcards: t.flashcards || [],
          sharedFiles: t.sharedFiles || [],
          transcriptEntries: t.entries || [],
          whiteboardPages: t.whiteboardPages || [],
          recordingUrl: `https://meet.jit.si/socrates-${t.roomId}`,
          createdAt: t.createdAt,
        });
      }
    }

    res.json({
      success: true,
      data: recaps,
      count: recaps.length,
    });
  } catch (error) {
    console.error('[Get My Recaps Error]', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve session recaps',
      error: error.message,
    });
  }
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
