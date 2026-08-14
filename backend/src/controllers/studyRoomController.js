const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');
const StudyRoom = require('../models/StudyRoom');
const StudyRoomMessage = require('../models/StudyRoomMessage');
const DoubtThread = require('../models/DoubtThread');

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
 * Get room details + participants (supports Mongo ID, meetingId, or fallback data for shareable links)
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

  // Fallback for custom shareable meeting links (e.g., /meeting/abc123xyz) so guest & direct link entry always works
  if (!room) {
    room = {
      _id: roomIdOrMeetingId,
      meetingId: roomIdOrMeetingId,
      title: `Study Session (${roomIdOrMeetingId})`,
      subject: 'Tutoring Session',
      description: 'Live 1-on-1 / Group Tutoring Meeting',
      status: 'active',
      participants: [],
      maxCapacity: 10,
    };
  }

  res.json({ success: true, data: room });
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

  // Check capacity
  if (room.participants.length >= room.maxCapacity) {
    return res.status(400).json({ success: false, message: 'Study room is at full capacity' });
  }

  // Check if already in room
  const alreadyJoined = room.participants.some(
    (p) => p.user.toString() === req.user._id.toString()
  );

  if (alreadyJoined) {
    return res.status(400).json({ success: false, message: 'You are already in this room' });
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

/**
 * POST /api/v1/study-rooms/:id/end
 * End a study room (host only)
 */
exports.endRoom = async (req, res) => {
  const room = await StudyRoom.findById(req.params.id);

  if (!room) {
    return res.status(404).json({ success: false, message: 'Study room not found' });
  }

  if (room.host.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Only the host can end this room' });
  }

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
  }

  res.json({ success: true, message: 'Room ended' });
};

/**
 * GET /api/v1/study-rooms/:id/messages
 * Get room chat history (paginated)
 */
exports.getMessages = async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [messages, total] = await Promise.all([
    StudyRoomMessage.find({ room: req.params.id })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('sender', 'fullName profileImage')
      .lean(),
    StudyRoomMessage.countDocuments({ room: req.params.id }),
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
