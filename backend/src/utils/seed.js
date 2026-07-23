require('dotenv').config();
const mongoose = require('mongoose');
const Tutor = require('../models/Tutor');
const StudyRoom = require('../models/StudyRoom');
const Category = require('../models/Category');
const PlatformStat = require('../models/PlatformStat');
const FAQ = require('../models/FAQ');
const Testimonial = require('../models/Testimonial');

const User = require('../models/User');

const connStr = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/socrates';

async function seedDB() {
  try {
    await mongoose.connect(connStr);
    console.log('[Seed] Connected to MongoDB for seeding...');

    await Promise.all([
      User.deleteMany({}),
      Tutor.deleteMany({}),
      StudyRoom.deleteMany({}),
      Category.deleteMany({}),
      PlatformStat.deleteMany({}),
      FAQ.deleteMany({}),
      Testimonial.deleteMany({}),
    ]);

    await User.create([
      {
        name: 'Alex Rivera',
        email: 'student@socrates.edu',
        password: 'password123',
        role: 'student',
        bio: 'Computer Science Major exploring AI and Distributed Systems.',
        subjects: ['Algorithms', 'Python', 'React'],
      },
      {
        name: 'Dr. Evelyn Reed',
        email: 'tutor@socrates.edu',
        password: 'password123',
        role: 'tutor',
        bio: 'Stanford PhD in Computer Science with 8+ years teaching experience.',
        subjects: ['Algorithms & Data Structures', 'Machine Learning'],
        hourlyRate: 65,
        isVerified: true,
      },
    ]);

    await PlatformStat.insertMany([
      { numericValue: 50, suffix: 'K+', label: 'Students', order: 1 },
      { numericValue: 10, suffix: 'K+', label: 'Sessions', order: 2 },
      { numericValue: 2, suffix: 'K+', label: 'Tutors', order: 3 },
      { numericValue: 95, suffix: '%', label: 'Satisfaction', order: 4 },
    ]);

    await Tutor.insertMany([
      {
        name: 'Dr. Evelyn Reed',
        subject: 'Algorithms & Data Structures',
        experience: '8+ yrs exp • Stanford PhD',
        rating: 4.98,
        reviews: '142 sessions',
        image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400',
        hourlyRate: 65,
        isFeatured: true,
      },
      {
        name: 'Marcus Chen',
        subject: 'Linear Algebra & AI Foundations',
        experience: '6+ yrs exp • MIT Alum',
        rating: 4.95,
        reviews: '98 sessions',
        image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
        hourlyRate: 55,
        isFeatured: true,
      },
      {
        name: 'Sophia Williams',
        subject: 'Quantum Mechanics & Physics',
        experience: '10+ yrs exp • Cambridge Postdoc',
        rating: 5.0,
        reviews: '210 sessions',
        image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=400',
        hourlyRate: 70,
        isFeatured: true,
      },
    ]);

    await FAQ.insertMany([
      {
        q: 'How does Socratic AI differ from standard ChatGPT or search engines?',
        a: 'Unlike general AI models that immediately give away raw code or answers, Socratic AI is engineered specifically for pedagogy. It analyzes your current knowledge level and prompts you with targeted sub-questions so you derive the concept yourself.',
        order: 1,
      },
      {
        q: 'How are human tutors verified on SOCRATES?',
        a: 'Every human tutor undergoes a 3-stage vetting process: academic credentials verification (degree transcripts or research positions), a live technical teaching demonstration, and background checks.',
        order: 2,
      },
      {
        q: 'Can I combine AI study sessions with human tutors?',
        a: 'Yes! That is the core architecture of SOCRATES. You can use Socratic AI to isolate your exact confusion points, and then book a targeted 20-minute session with a human tutor to resolve high-level intuition.',
        order: 3,
      },
      {
        q: 'Are peer study rooms free to join?',
        a: 'Public peer study rooms are completely free for all registered SOCRATES users. Student Pro members can also spawn private invite-only study lounges.',
        order: 4,
      },
      {
        q: 'How are AI Session Recaps created?',
        a: 'During live sessions, our AI transcribes audio and whiteboard notes in real time, automatically extracting key formulas, step-by-step algorithms, and downloadable flashcards.',
        order: 5,
      },
    ]);

    console.log('[Seed] Success! Database seeded cleanly with Apple-design compliant sample data.');
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]', error);
    process.exit(1);
  }
}

seedDB();
