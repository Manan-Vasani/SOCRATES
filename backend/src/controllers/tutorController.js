const Tutor = require('../models/Tutor');
const Booking = require('../models/Booking');
const User = require('../models/User');

const SEEDED_TUTORS = [
  {
    id: 'tut_101',
    name: 'Dr. Evelyn Reed',
    subject: 'Algorithms & Data Structures',
    experience: '8+ yrs exp • Stanford PhD',
    rating: 4.98,
    reviews: '142 reviews',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
    hourlyRate: 65,
    subjects: ['Algorithms', 'Data Structures', 'Python', 'C++'],
    bio: 'Specialized in Graph Theory, Dynamic Programming, and High-Performance Algorithm Design for CS majors.',
    isFeatured: true,
  },
  {
    id: 'tut_102',
    name: 'Marcus Chen',
    subject: 'Linear Algebra & AI Foundations',
    experience: '6+ yrs exp • MIT Alum',
    rating: 4.95,
    reviews: '98 reviews',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    hourlyRate: 55,
    subjects: ['Linear Algebra', 'PyTorch', 'Machine Learning', 'Python'],
    bio: 'Passionate about demystifying Matrix Decompositions, Vector Calculus, and Deep Learning models.',
    isFeatured: true,
  },
  {
    id: 'tut_103',
    name: 'Sophia Williams',
    subject: 'Quantum Mechanics & Physics',
    experience: '10+ yrs exp • Cambridge Postdoc',
    rating: 5.0,
    reviews: '210 reviews',
    image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80',
    hourlyRate: 70,
    subjects: ['Quantum Physics', 'Calculus', 'Thermodynamics'],
    bio: 'Theoretical Physicist helping university students master Quantum Computing and Electromagnetism.',
    isFeatured: true,
  },
  {
    id: 'tut_104',
    name: 'Alexandre Dubois',
    subject: 'Full-Stack React & Node Systems',
    experience: '7+ yrs exp • Senior Staff Engineer',
    rating: 4.92,
    reviews: '76 reviews',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    hourlyRate: 60,
    subjects: ['React', 'TypeScript', 'Node.js', 'MongoDB'],
    bio: 'Building real-world scalable web applications, TypeScript architecture, and cloud database backends.',
    isFeatured: true,
  },
  {
    id: 'tut_105',
    name: 'Priya Sharma',
    subject: 'Statistics & Data Science',
    experience: '5+ yrs exp • UC Berkeley MS',
    rating: 4.97,
    reviews: '115 reviews',
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
    hourlyRate: 50,
    subjects: ['Statistics', 'Data Science', 'Python', 'R'],
    bio: 'Expert in Applied Probability, Hypothesis Testing, Pandas, Data Visualization, and Econometrics.',
    isFeatured: true,
  },
  {
    id: 'tut_106',
    name: 'David Vance',
    subject: 'Organic Chemistry & Biochemistry',
    experience: '9+ yrs exp • Johns Hopkins MD',
    rating: 4.99,
    reviews: '184 reviews',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    hourlyRate: 65,
    subjects: ['Organic Chemistry', 'Biochemistry', 'MCAT Prep'],
    bio: 'Helping pre-med and chemistry scholars conquer Reaction Mechanisms, Synthesis, and Spectroscopy.',
    isFeatured: true,
  },
];

// Helper to normalize tutor lookup
const findTutorInList = (id, list) => {
  const searchKey = String(id).toLowerCase();
  return list.find((t) => {
    const tid = String(t.id || t._id).toLowerCase();
    const rawNum = tid.replace('tut_', '');
    return tid === searchKey || searchKey === rawNum || searchKey.includes(tid) || searchKey.includes(rawNum);
  });
};

// GET /api/v1/tutors
exports.getAllTutors = async (req, res) => {
  try {
    let dbTutors = await Tutor.find();
    let tutorsList = dbTutors && dbTutors.length > 0 ? dbTutors.map(t => t.toObject ? t.toObject() : t) : [...SEEDED_TUTORS];

    const dbUsers = await User.find({ role: { $in: ['tutor', 'both'] } });
    const userTutors = dbUsers.map(u => ({
      _id: u._id.toString(),
      id: u._id.toString(),
      name: u.fullName || u.name || 'Peer Tutor',
      subject: u.subjects && u.subjects.length > 0 ? u.subjects.join(', ') : 'Computer Science',
      experience: u.bio ? (u.bio.length > 60 ? u.bio.slice(0, 60) + '...' : u.bio) : 'Verified Peer Tutor',
      rating: 5.0,
      reviews: '0 reviews',
      image: u.profileImage || u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      hourlyRate: u.hourlyRate || 45,
      isFeatured: false,
      subjects: u.subjects || []
    }));

    // Deduplicate by name (case-insensitive) to avoid double listing
    const merged = [...tutorsList];
    userTutors.forEach(ut => {
      const exists = merged.some(t => t.name.toLowerCase() === ut.name.toLowerCase());
      if (!exists) {
        merged.push(ut);
      }
    });

    res.json({ success: true, data: merged });
  } catch (error) {
    res.json({ success: true, data: SEEDED_TUTORS });
  }
};

// GET /api/v1/tutors/:id
exports.getTutorById = async (req, res) => {
  try {
    const { id } = req.params;
    let tutor = null;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      tutor = await Tutor.findById(id).catch(() => null);
      if (!tutor) {
        const dbUser = await User.findById(id).catch(() => null);
        if (dbUser && (dbUser.role === 'tutor' || dbUser.role === 'both')) {
          tutor = {
            _id: dbUser._id.toString(),
            id: dbUser._id.toString(),
            name: dbUser.fullName || dbUser.name || 'Peer Tutor',
            subject: dbUser.subjects && dbUser.subjects.length > 0 ? dbUser.subjects.join(', ') : 'Computer Science',
            experience: dbUser.bio ? (dbUser.bio.length > 60 ? dbUser.bio.slice(0, 60) + '...' : dbUser.bio) : 'Verified Peer Tutor',
            rating: 5.0,
            reviews: '0 reviews',
            image: dbUser.profileImage || dbUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
            hourlyRate: dbUser.hourlyRate || 45,
            isFeatured: false,
            subjects: dbUser.subjects || [],
            availability: dbUser.availability || []
          };
        }
      }
    }

    if (!tutor) {
      tutor = findTutorInList(id, SEEDED_TUTORS);
    }

    if (!tutor) {
      return res.status(404).json({ success: false, message: 'Tutor profile not found' });
    }

    let tutorData = tutor.toObject ? tutor.toObject() : { ...tutor };
    if (!tutorData.availability) {
      const tutorName = tutor.name;
      const userTutor = await User.findOne({
        $or: [
          { fullName: new RegExp('^' + tutorName + '$', 'i') },
          { name: new RegExp('^' + tutorName + '$', 'i') }
        ]
      });
      if (userTutor && userTutor.availability) {
        tutorData.availability = userTutor.availability;
      } else {
        tutorData.availability = [];
      }
    }

    res.json({ success: true, data: tutorData });
  } catch (error) {
    const fallback = findTutorInList(req.params.id, SEEDED_TUTORS) || SEEDED_TUTORS[0];
    let tutorData = { ...fallback };
    try {
      const userTutor = await User.findOne({
        $or: [
          { fullName: new RegExp('^' + tutorData.name + '$', 'i') },
          { name: new RegExp('^' + tutorData.name + '$', 'i') }
        ]
      });
      if (userTutor && userTutor.availability) {
        tutorData.availability = userTutor.availability;
      } else {
        tutorData.availability = [];
      }
    } catch (e) {
      tutorData.availability = [];
    }
    res.json({ success: true, data: tutorData });
  }
};

// GET /api/v1/tutors/:id/bookings
exports.getTutorBookings = async (req, res) => {
  try {
    const { id } = req.params;
    const bookings = await Booking.find({ tutorId: id, status: { $ne: 'cancelled' } }).sort({ date: 1, time: 1 });
    res.json({ success: true, data: bookings });
  } catch (error) {
    res.json({ success: true, data: [] });
  }
};

// POST /api/v1/tutors/:id/book
exports.createBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { studentName, date, time, subject, duration, topic, fee } = req.body;

    if (!studentName || !date || !time || !subject || !fee) {
      return res.status(400).json({ success: false, message: 'Missing required booking fields' });
    }

    const cleanDate = date.trim();
    const cleanTime = time.trim();

    // Check for existing active booking for this tutor at the requested date and time slot
    const existingBooking = await Booking.findOne({
      tutorId: id,
      date: cleanDate,
      time: cleanTime,
      status: { $ne: 'cancelled' },
    });

    if (existingBooking) {
      return res.status(409).json({
        success: false,
        message: `This time slot (${cleanTime}) on ${cleanDate} is already booked for this tutor. Please select another time slot.`,
      });
    }

    const booking = await Booking.create({
      tutorId: id,
      studentId: req.user ? req.user._id : undefined,
      studentName,
      date: cleanDate,
      time: cleanTime,
      subject,
      duration: duration || 60,
      topic: topic || '',
      fee,
      meetingId: req.body.meetingId || `sess-${Date.now()}`,
      status: 'confirmed',
    });

    res.status(201).json({
      success: true,
      message: 'Session booked successfully with tutor!',
      data: booking,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Could not complete booking process' });
  }
};
