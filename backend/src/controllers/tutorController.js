const Tutor = require('../models/Tutor');
const Booking = require('../models/Booking');

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
    if (!dbTutors || dbTutors.length === 0) {
      return res.json({ success: true, data: SEEDED_TUTORS });
    }
    res.json({ success: true, data: dbTutors });
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
    }

    if (!tutor) {
      tutor = findTutorInList(id, SEEDED_TUTORS);
    }

    if (!tutor) {
      return res.status(404).json({ success: false, message: 'Tutor profile not found' });
    }

    res.json({ success: true, data: tutor });
  } catch (error) {
    const fallback = findTutorInList(req.params.id, SEEDED_TUTORS) || SEEDED_TUTORS[0];
    res.json({ success: true, data: fallback });
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

    const booking = await Booking.create({
      tutorId: id,
      studentName,
      date,
      time,
      subject,
      duration: duration || 60,
      topic: topic || '',
      fee,
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
