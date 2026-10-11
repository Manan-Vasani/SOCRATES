import React, { useState, useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  ArrowDownWideNarrow,
  ArrowLeft,
  ArrowUpNarrowWide,
  Atom,
  BookOpen,
  Calendar,
  Check,
  CheckSquare,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Code2,
  Cpu,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  FileCode,
  FileDown,
  FileText,
  Filter,
  FlaskConical,
  FolderDown,
  Image as ImageIcon,
  Layers,
  Lightbulb,
  ListTodo,
  Play,
  Presentation,
  RotateCcw,
  Search,
  Sigma,
  Sparkles,
  Square,
  User,
  Video,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { fetchMyRecaps } from '../services/api'
import {
  getStoredWhiteboardPages,
  downloadSingleWhiteboardPage,
  downloadAllWhiteboardPages,
  renderPageToCanvas,
  generateRealisticWhiteboardPages,
} from '../utils/whiteboardExport'
import type { WhiteboardPage } from '../components/study/Whiteboard'

export interface SessionSlide {
  slideNumber: number
  title: string
  description?: string
  imageUrl?: string
  equations?: string[]
  keyPoints?: string[]
}

interface Flashcard {
  question: string
  answer: string
}

interface SharedFile {
  name: string
  url: string
  uploadedBy?: string
}

interface SessionRecord {
  id: string
  roomId?: string
  title: string
  subject: string
  topic?: string
  tutorName: string
  studentName?: string
  studentNames?: string[]
  tutorAvatar?: string
  date: string
  duration: string
  fileSize?: string
  thumbnailUrl: string
  videoUrl: string
  recordingUrl?: string
  executiveSummary?: string
  aiSummary: string[]
  actionItems?: string[]
  keyEquations: string[]
  flashcards?: Flashcard[]
  sharedFiles?: SharedFile[]
  slides?: SessionSlide[]
  whiteboardPages?: WhiteboardPage[]
  totalWords?: number
  transcript: { time: string; speaker: string; text: string; role?: string }[]
}

export const TUTOR_AVATAR_MAP: Record<string, string> = {
  'Dr. Alex Vance': 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400',
  'Elena Rostova': 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400',
  'Prof. Sarah Jenkins': 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=400',
  'Dr. Evelyn Reed': 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400',
  'Marcus Chen': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400',
  'Sophia Williams': 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=400',
  'Alexandre Dubois': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
  'Priya Sharma': 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400',
  'David Vance': 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400',
}

export const getTutorAvatar = (tutorName: string, customAvatar?: string): string => {
  if (customAvatar && customAvatar.trim() !== '') return customAvatar
  if (tutorName && TUTOR_AVATAR_MAP[tutorName]) return TUTOR_AVATAR_MAP[tutorName]
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(tutorName || 'Tutor')}&background=0066cc&color=fff&size=128&bold=true`
}

export const getRecordStudents = (record: SessionRecord): string[] => {
  const set = new Set<string>()

  if (Array.isArray(record.studentNames)) {
    record.studentNames.forEach((s) => {
      const trimmed = s?.trim()
      if (trimmed) set.add(trimmed)
    })
  }

  if (record.studentName) {
    record.studentName.split(/[,&]/).forEach((s) => {
      const trimmed = s?.trim()
      if (trimmed) set.add(trimmed)
    })
  }

  if (Array.isArray(record.transcript)) {
    const tutorLower = (record.tutorName || '').toLowerCase().trim()
    record.transcript.forEach((t) => {
      const speaker = (t.speaker || '').trim()
      const speakerLower = speaker.toLowerCase()
      if (
        speaker &&
        speakerLower !== 'system' &&
        speakerLower !== tutorLower &&
        !tutorLower.includes(speakerLower) &&
        (t.role === 'student' || !t.role || t.role === 'participant')
      ) {
        set.add(speaker)
      }
    })
  }

  const result = Array.from(set)
  return result.length > 0 ? result : (record.studentName ? [record.studentName] : ['Student'])
}

const SAMPLE_RECORDINGS: SessionRecord[] = [
  {
    id: 'rec-1',
    roomId: 'sess-101',
    title: 'Advanced Calculus: Integration by Parts & Partial Fractions',
    subject: 'Mathematics',
    topic: 'Integration by Parts & ILATE Strategy',
    tutorName: 'Dr. Alex Vance',
    tutorAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400',
    studentName: 'Alex Chen',
    studentNames: ['Alex Chen', 'Sophia Taylor'],
    date: 'Aug 2, 2026',
    duration: '45 mins',
    fileSize: '320 MB',
    totalWords: 3420,
    thumbnailUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=800&auto=format&fit=crop',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    executiveSummary: 'This advanced calculus masterclass established the core foundations of Integration by Parts, transforming complex product integrals through systematic reduction. The student achieved complete mastery of boundary evaluations and partial fraction decompositions.',
    aiSummary: [
      'Derived the Product Rule origin for Integration by Parts: ∫ u dv = uv - ∫ v du.',
      'Demonstrated ILATE rule priority for choosing u (Inverse trig, Logarithmic, Algebraic, Trigonometric, Exponential).',
      'Solved 3 complex improper integral problems on the digital whiteboard.',
    ],
    actionItems: [
      'Solve problems #14 to #22 from Chapter 7.2 on partial fraction expansions.',
      'Practice evaluating improper integrals with infinite upper limits.',
      'Complete the active-recall flashcards below to solidify the ILATE rule.',
    ],
    keyEquations: [
      '\\int u \\, dv = uv - \\int v \\, du',
      '\\int \\frac{1}{x^2 + a^2} dx = \\frac{1}{a} \\arctan\\left(\\frac{x}{a}\\right) + C',
    ],
    flashcards: [
      {
        question: 'What does each letter in the ILATE acronym represent for selecting u in integration by parts?',
        answer: 'Inverse Trigonometric, Logarithmic, Algebraic, Trigonometric, Exponential.',
      },
      {
        question: 'When should you choose Tabular Integration (DI Method) over standard integration by parts?',
        answer: 'When one factor differentiates to zero after repeated derivatives (e.g. polynomials multiplied by sine, cosine, or exponential functions).',
      },
      {
        question: 'What is the algebraic form for decomposing a repeated linear factor 1/(x-a)^2?',
        answer: 'A/(x - a) + B/(x - a)^2',
      },
    ],
    sharedFiles: [
      { name: 'Integration_By_Parts_Cheatsheet.pdf', url: '#', uploadedBy: 'Dr. Alex Vance' },
      { name: 'Calculus_Whiteboard_Export.png', url: '#', uploadedBy: 'Alex Chen' },
    ],
    slides: [
      {
        slideNumber: 1,
        title: 'ILATE Priority Hierarchy for Integration by Parts',
        description: 'Establishing the systematic priority rule for selecting u vs dv in complex product integrals.',
        imageUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=1200&auto=format&fit=crop',
        equations: [
          '\\int u \\, dv = uv - \\int v \\, du',
          '\\text{Hierarchy: } I \\to L \\to A \\to T \\to E',
        ],
        keyPoints: [
          'I: Inverse Trigonometric functions (arcsin, arctan)',
          'L: Logarithmic functions (ln x, log_a x)',
          'A: Algebraic powers and polynomials (x^2, 3x)',
          'T: Trigonometric functions (sin x, cos x)',
          'E: Exponential terms (e^x, 2^x)',
        ],
      },
      {
        slideNumber: 2,
        title: 'Whiteboard Derivation: Product Rule to Integration by Parts',
        description: 'Complete board derivation showing how Leibniz product rule rearranges into the standard integral formula.',
        imageUrl: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?q=80&w=1200&auto=format&fit=crop',
        equations: [
          '\\frac{d}{dx}[u(x)v(x)] = u\'(x)v(x) + u(x)v\'(x)',
          'uv = \\int v\\,du + \\int u\\,dv \\implies \\int u\\,dv = uv - \\int v\\,du',
        ],
        keyPoints: [
          'Integrating both sides transforms the differential identity into an integral form.',
          'Differentiating u reduces polynomial degree by 1 on each iteration.',
          'dv must always be integrable via elementary anti-derivative techniques.',
        ],
      },
      {
        slideNumber: 3,
        title: 'Worked Example: Evaluating ∫ x · cos(x) dx',
        description: 'Step-by-step whiteboard application with sign verification and constant of integration.',
        imageUrl: 'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?q=80&w=1200&auto=format&fit=crop',
        equations: [
          'u = x \\implies du = dx',
          'dv = \\cos(x)dx \\implies v = \\sin(x)',
          '\\int x\\cos(x)dx = x\\sin(x) - \\int \\sin(x)dx = x\\sin(x) + \\cos(x) + C',
        ],
        keyPoints: [
          'Recognized x as Algebraic (priority for u) and cos(x) as Trigonometric (assigned to dv).',
          'Checked derivative sign: derivative of -cos(x) is +sin(x).',
          'Verified with student Alex Chen on whiteboard quadrant canvas.',
        ],
      },
      {
        slideNumber: 4,
        title: 'Tabular (DI) Method for Repeated Polynomial Integrals',
        description: 'D-I column shorthand technique for multi-stage polynomial reductions without nested integration.',
        imageUrl: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?q=80&w=1200&auto=format&fit=crop',
        equations: [
          '\\int x^3 e^{2x} dx = \\frac{x^3 e^{2x}}{2} - \\frac{3x^2 e^{2x}}{4} + \\frac{6x e^{2x}}{8} - \\frac{6 e^{2x}}{16} + C',
        ],
        keyPoints: [
          'Column 1: Signs (+, -, +, -, ...)',
          'Column 2: Derivatives of polynomial until reaching 0.',
          'Column 3: Successive anti-derivatives of exponential.',
          'Sum diagonal products with corresponding signs.',
        ],
      },
    ],
    transcript: [
      { time: '00:02', speaker: 'Dr. Alex Vance', text: 'Welcome back! Today we are diving into advanced integration techniques.' },
      { time: '05:14', speaker: 'Alex Chen', text: 'Can we go over how to pick u when both algebraic and trig functions appear?' },
      { time: '05:30', speaker: 'Dr. Alex Vance', text: 'Great question! Remember the ILATE rule hierarchy. Algebraic comes before Trigonometric.' },
      { time: '14:10', speaker: 'Sophia Taylor', text: 'Does that mean trigonometric functions should always be chosen as dv if exponential is absent?' },
      { time: '14:28', speaker: 'Dr. Alex Vance', text: 'Spot on, Sophia. ILATE prioritizes Algebraic for u over Trigonometric.' },
      { time: '22:40', speaker: 'Dr. Alex Vance', text: 'Let us draw this step on the whiteboard and check our boundary limits.' },
    ],
  },
  {
    id: 'rec-2',
    roomId: 'sess-102',
    title: 'Data Structures: Graph Traversal & Dijkstra Algorithm',
    subject: 'Computer Science',
    topic: 'Dijkstra Shortest Path & Priority Queues',
    tutorName: 'Elena Rostova',
    tutorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400',
    studentName: 'Alex Chen',
    studentNames: ['Alex Chen', 'Marcus Brody'],
    date: 'Jul 30, 2026',
    duration: '60 mins',
    fileSize: '410 MB',
    totalWords: 4180,
    thumbnailUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=800&auto=format&fit=crop',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    executiveSummary: 'Collaborative analysis of single-source shortest path algorithms. Implemented an optimized Dijkstra algorithm using a Min-Heap priority queue in Python and verified asymptotic complexity guarantees.',
    aiSummary: [
      'Implemented Min-Heap priority queue optimization for Dijkstra in Python.',
      'Analyzed O((V + E) log V) time complexity vs O(V^2) unoptimized matrix approach.',
      'Ran live test cases in SOCRATES Code Sandbox IDE.',
    ],
    actionItems: [
      'Implement Bellman-Ford algorithm to handle graphs with negative edge weights.',
      'Benchmark Dijkstra heap implementation on 10,000 node random graph.',
      'Review topological sorting for Directed Acyclic Graphs (DAGs).',
    ],
    keyEquations: [
      'd[v] = \\min(d[v], d[u] + w(u, v))',
      'Time\\ Complexity = O((V + E) \\log V)',
    ],
    flashcards: [
      {
        question: 'Why does standard Dijkstra algorithm fail on graphs containing negative edge weights?',
        answer: 'Dijkstra greedily assumes that once a vertex is marked visited with the minimum distance, its shortest path is permanently finalized. A negative edge explored later could invalidate that greedy choice.',
      },
      {
        question: 'What is the time complexity of Dijkstra using a Fibonacci Heap vs a Binary Min-Heap?',
        answer: 'Fibonacci Heap: O(E + V log V). Binary Min-Heap: O((V + E) log V).',
      },
    ],
    sharedFiles: [
      { name: 'dijkstra_min_heap.py', url: '#', uploadedBy: 'Elena Rostova' },
    ],
    slides: [
      {
        slideNumber: 1,
        title: 'Single-Source Shortest Path & Dijkstra Invariant',
        description: 'Formal formulation of relaxation and the greedy distance finalization property.',
        imageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=1200&auto=format&fit=crop',
        equations: [
          'd[v] = \\min(d[v],\\; d[u] + w(u, v))',
          '\\forall u \\in S,\\; d[u] = \\delta(s, u)',
        ],
        keyPoints: [
          'Non-negative edge weights condition: w(u, v) >= 0.',
          'Greedy choice property: once a vertex is popped, its distance estimate is optimal.',
          'Why Dijkstra fails on negative edge weights (Bellman-Ford needed).',
        ],
      },
      {
        slideNumber: 2,
        title: 'Min-Heap Priority Queue Architecture & Complexity',
        description: 'Comparing adjacency matrix O(V^2) vs adjacency list with binary min-heap O((V + E) log V).',
        imageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=1200&auto=format&fit=crop',
        equations: [
          'T(V, E) = O(V \\cdot \\text{ExtractMin} + E \\cdot \\text{DecreaseKey})',
          '\\text{Binary Heap: } O((V + E) \\log V)',
          '\\text{Fibonacci Heap: } O(E + V \\log V)',
        ],
        keyPoints: [
          'Extract-Min takes O(log V) time.',
          'Relaxation triggers push of updated distance tuple taking O(log V).',
          'Space complexity is bounded by O(V + E) for storing adjacency lists.',
        ],
      },
      {
        slideNumber: 3,
        title: 'Live Whiteboard Trace: 5-Node Graph Execution',
        description: 'Tracing distance array states and priority queue transitions across 5 iterations.',
        imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1200&auto=format&fit=crop',
        equations: [
          '\\text{Source } S=0: \\; d = [0, \\infty, \\infty, \\infty, \\infty]',
          '\\text{After Node 0: } d = [0, 4, 2, \\infty, \\infty]',
          '\\text{Final Shortest Paths: } d = [0, 3, 2, 8, 7]',
        ],
        keyPoints: [
          'Demonstrated on digital whiteboard with real-time student participation.',
          'Verified with Python Code Sandbox execution in live study room.',
        ],
      },
    ],
    transcript: [
      { time: '00:05', speaker: 'Elena Rostova', text: 'Let us start by building an adjacency list representation of our graph.' },
      { time: '14:20', speaker: 'Alex Chen', text: 'Why do we use a priority queue instead of a standard FIFO queue?' },
      { time: '14:45', speaker: 'Elena Rostova', text: 'Because we always want to extract the vertex with the smallest distance estimation next.' },
      { time: '18:30', speaker: 'Marcus Brody', text: 'Can we trace the priority queue decrease-key operation step by step?' },
    ],
  },
  {
    id: 'rec-3',
    roomId: 'sess-103',
    title: 'Quantum Mechanics: Wave Packet Dispersion & Uncertainty',
    subject: 'Physics',
    topic: 'Heisenberg Uncertainty & Gaussian Packets',
    tutorName: 'Prof. Sarah Jenkins',
    tutorAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=400',
    studentName: 'Alex Chen',
    studentNames: ['Alex Chen', 'Liam Vance'],
    date: 'Jul 28, 2026',
    duration: '50 mins',
    fileSize: '380 MB',
    totalWords: 3890,
    thumbnailUrl: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?q=80&w=800&auto=format&fit=crop',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    executiveSummary: 'Derived the non-relativistic Schrödinger equation and explored wave packet broadening in free space. Highlighted the fundamental relationship between conjugate position and momentum spaces.',
    aiSummary: [
      'Derived the Heisenberg Uncertainty Principle Δx Δp ≥ ħ/2 from Fourier transform pairs.',
      'Simulated Gaussian wave packet broadening over time on the shared canvas.',
    ],
    actionItems: [
      'Calculate the group velocity vs phase velocity for a free electron packet.',
      'Solve the 1D infinite square well boundary condition problem.',
    ],
    keyEquations: [
      '\\Delta x \\cdot \\Delta p \\ge \\frac{\\hbar}{2}',
      'i\\hbar \\frac{\\partial}{\\partial t} \\psi(x,t) = \\hat{H} \\psi(x,t)',
    ],
    flashcards: [
      {
        question: 'What is the physical meaning of the wavefunction modulus squared |ψ(x,t)|²?',
        answer: 'Born Rule: The probability density of finding the particle at position x at time t.',
      },
    ],
    sharedFiles: [],
    slides: [
      {
        slideNumber: 1,
        title: 'Heisenberg Uncertainty Principle & Fourier Concurrency',
        description: 'Deriving conjugate position and momentum uncertainty bounds from non-commuting operators.',
        imageUrl: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?q=80&w=1200&auto=format&fit=crop',
        equations: [
          '\\Delta x \\cdot \\Delta p \\ge \\frac{\\hbar}{2}',
          '[\\hat{x}, \\hat{p}] = i\\hbar \\hat{I}',
        ],
        keyPoints: [
          'Commutator relation between position and momentum operators.',
          'Physical implication: exact position precision completely delocalizes wave frequency.',
          'Equality holds strictly for Gaussian minimum uncertainty wave packets.',
        ],
      },
      {
        slideNumber: 2,
        title: 'Gaussian Wave Packet Dispersion in Free Space',
        description: 'Time evolution of spatial variance showing how wave packets spread over time without potential.',
        imageUrl: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?q=80&w=1200&auto=format&fit=crop',
        equations: [
          '\\sigma(t) = \\sigma_0 \\sqrt{1 + \\left(\\frac{\\hbar t}{2m \\sigma_0^2}\\right)^2}',
        ],
        keyPoints: [
          'Narrower initial spatial distribution σ0 causes faster subsequent spreading.',
          'Group velocity vs phase velocity dispersion relations.',
          'Demonstrated on shared chalkboard canvas with student participation.',
        ],
      },
      {
        slideNumber: 3,
        title: '1D Infinite Square Well Boundary Conditions',
        description: 'Standing wave quantization and boundary nodes at x=0 and x=L.',
        imageUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=1200&auto=format&fit=crop',
        equations: [
          '\\psi_n(x) = \\sqrt{\\frac{2}{L}} \\sin\\left(\\frac{n\\pi x}{L}\\right)',
          'E_n = \\frac{n^2 \\pi^2 \\hbar^2}{2m L^2}',
        ],
        keyPoints: [
          'Wavefunction vanishes at boundaries: ψ(0) = ψ(L) = 0.',
          'Energy states are strictly discrete and scale with n^2.',
          'Ground state n=1 possesses zero-point energy.',
        ],
      },
    ],
    transcript: [
      { time: '00:10', speaker: 'Prof. Sarah Jenkins', text: 'Today we explore how momentum uncertainty causes spatial spreading of wavepackets.' },
      { time: '08:45', speaker: 'Liam Vance', text: 'How does wavepacket dispersion differ in a non-zero potential well?' },
    ],
  },
]

const getSubjectFilterIcon = (subj: string, isActive: boolean) => {
  const colorClass = isActive ? 'text-white' : 'text-[#0066cc]'
  switch (subj) {
    case 'All':
      return <Layers size={14} className={`${colorClass} shrink-0`} />
    case 'Mathematics':
      return <Sigma size={14} className={`${colorClass} shrink-0`} />
    case 'Computer Science':
      return <Code2 size={14} className={`${colorClass} shrink-0`} />
    case 'Physics':
      return <Atom size={14} className={`${colorClass} shrink-0`} />
    case 'Chemistry':
      return <FlaskConical size={14} className={`${colorClass} shrink-0`} />
    case 'Engineering':
      return <Cpu size={14} className={`${colorClass} shrink-0`} />
    default:
      return <BookOpen size={14} className={`${colorClass} shrink-0`} />
  }
}

function RecordingCardSkeleton() {
  return (
    <div className="bg-white rounded-3xl border border-[#e5e5e7] overflow-hidden shadow-xs grid grid-cols-1 md:grid-cols-12 gap-0 animate-pulse select-none">
      <div className="md:col-span-5 lg:col-span-4 min-h-[220px] bg-[#f0f0f2]" />
      <div className="md:col-span-7 lg:col-span-8 p-7 sm:p-8 space-y-5 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="h-6 bg-[#e5e5e7]/80 rounded-md w-3/4" />
            <div className="h-4 bg-[#e5e5e7]/50 rounded-md w-1/3" />
          </div>
          <div className="h-20 bg-[#f4f8fc] rounded-2xl border border-[#0066cc]/10 p-4 space-y-2" />
        </div>
        <div className="h-10 bg-[#f5f5f7] rounded-xl w-full" />
      </div>
    </div>
  )
}

const generateFallbackSlides = (rec: Partial<SessionRecord>): SessionSlide[] => {
  const equations = rec.keyEquations || []
  const takeaways = rec.aiSummary || []
  const title = rec.topic || rec.subject || 'Session Slide'

  return [
    {
      slideNumber: 1,
      title: `Overview: ${title}`,
      description: `Core theoretical overview and fundamentals discussed by ${rec.tutorName || 'the tutor'}.`,
      imageUrl: rec.thumbnailUrl,
      keyPoints: takeaways.length > 0 ? takeaways.slice(0, 2) : ['Comprehensive conceptual breakdown during live dialogue.'],
      equations: equations.slice(0, 1),
    },
    {
      slideNumber: 2,
      title: 'Detailed Problem Solving & Whiteboard Derivation',
      description: 'Step-by-step breakdown and mathematical modeling conducted during the interactive session.',
      imageUrl: rec.thumbnailUrl,
      keyPoints: takeaways.length > 2 ? takeaways.slice(2, 4) : ['Interactive problem analysis solved on collaborative whiteboard.'],
      equations: equations.slice(1, 3),
    },
    {
      slideNumber: 3,
      title: 'Key Applications & Synthesis',
      description: 'Synthesis of solution paradigms, boundary cases, and post-session homework implications.',
      imageUrl: rec.thumbnailUrl,
      keyPoints: takeaways.length > 4 ? takeaways.slice(4) : ['Core formulas verified for exam prep and homework practice.'],
      equations: equations.slice(3),
    },
  ]
}

export const getRecordWhiteboardPages = (record?: SessionRecord | null): WhiteboardPage[] => {
  if (!record) return []
  if (record.roomId) {
    const cached = getStoredWhiteboardPages(record.roomId)
    if (cached && cached.length > 0) return cached
  }
  if (record.whiteboardPages && record.whiteboardPages.length > 0) {
    return record.whiteboardPages
  }
  return generateRealisticWhiteboardPages(record.title, record.subject, record.keyEquations)
}

function WhiteboardCanvasViewer({
  page,
  className = '',
}: {
  page: WhiteboardPage
  className?: string
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !page) return
    canvas.width = 1920
    canvas.height = 1080
    renderPageToCanvas(page, canvas)
  }, [page])

  return (
    <div className={`relative w-full rounded-2xl overflow-hidden border border-[#d2d2d7] bg-[#fafbfc] shadow-md ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-auto block select-none pointer-events-none"
        style={{ aspectRatio: '16 / 9' }}
      />
    </div>
  )
}

function MiniCanvasThumbnail({
  page,
  isSelected,
  onClick,
  pageNumber,
}: {
  page: WhiteboardPage
  isSelected: boolean
  onClick: () => void
  pageNumber: number
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !page) return
    canvas.width = 480
    canvas.height = 270
    renderPageToCanvas(page, canvas)
  }, [page])

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative rounded-xl overflow-hidden text-left transition-all cursor-pointer border select-none p-1.5 flex flex-col gap-1.5 transform-gpu ${
        isSelected
          ? 'bg-white border-[#0066cc] shadow-md ring-2 ring-[#0066cc]/25'
          : 'bg-white/80 hover:bg-white border-[#e0e0e4] hover:border-[#b0b0b8]'
      }`}
    >
      <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-[#e5e5e7] bg-[#fafbfc]">
        <canvas
          ref={canvasRef}
          className="w-full h-full block object-contain pointer-events-none"
        />
        <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-xs text-[9px] font-mono font-bold text-white">
          Page {pageNumber}
        </div>
        {isSelected && (
          <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-[#0066cc] text-[9px] font-bold text-white shadow-xs">
            Active
          </div>
        )}
      </div>
      <div className="px-1 pb-0.5">
        <p className="text-[11px] font-bold text-[#1d1d1f] truncate">
          {page.title || `Page ${pageNumber}`}
        </p>
      </div>
    </button>
  )
}

export default function RecordingsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const roomQuery = searchParams.get('room')

  const [recordings, setRecordings] = useState<SessionRecord[]>(SAMPLE_RECORDINGS)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeSubject, setActiveSubject] = useState('All')
  const [selectedRecord, setSelectedRecord] = useState<SessionRecord | null>(null)
  const [isPlayingVideo, setIsPlayingVideo] = useState(false)
  const [selectedDateFilter, setSelectedDateFilter] = useState('All')
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [isSortOpen, setIsSortOpen] = useState(false)
  const [calendarYear, setCalendarYear] = useState(2026)
  const [calendarMonth, setCalendarMonth] = useState(6) // 0-indexed: 6 = July 2026

  // In-page Active Studio Tab: 'briefing' | 'slides' | 'flashcards' | 'checklist' | 'transcript'
  const [studioTab, setStudioTab] = useState<'briefing' | 'slides' | 'flashcards' | 'checklist' | 'transcript'>('briefing')
  const [activeSlideIndex, setActiveSlideIndex] = useState(0)
  const [revealedFlashcards, setRevealedFlashcards] = useState<Set<number>>(new Set())
  const [completedActions, setCompletedActions] = useState<Set<number>>(new Set())

  const studioRef = useRef<HTMLDivElement | null>(null)

  // Load real recaps from backend with skeleton state support (matches Tutors.tsx)
  const loadUserRecaps = React.useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true)
    else setIsLoading(true)
    try {
      const res = await fetchMyRecaps()
      if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
        const backendRecords: SessionRecord[] = res.data.map((item: any) => ({
          id: item.id || `rec-${item.roomId}`,
          roomId: item.roomId,
          title: `${item.subject}: ${item.topic || 'Interactive Practice'}`,
          subject: item.subject || 'General Tutoring',
          topic: item.topic || 'Socratic Tutoring',
          tutorName: item.tutorName || 'Mentor',
          studentName: item.studentName || 'Student',
          studentNames: Array.isArray(item.studentNames) && item.studentNames.length > 0
            ? item.studentNames
            : (item.studentName ? [item.studentName] : ['Student']),
          tutorAvatar: item.tutorAvatar,
          date: item.date || 'Recent',
          duration: `${item.durationMinutes || 60} mins`,
          fileSize: 'HD Video & Audio',
          totalWords: item.totalWords || 0,
          thumbnailUrl: item.thumbnailUrl || (item.subject?.toLowerCase().includes('math')
            ? 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=800&auto=format&fit=crop'
            : item.subject?.toLowerCase().includes('computer')
            ? 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=800&auto=format&fit=crop'
            : 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?q=80&w=800&auto=format&fit=crop'),
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
          recordingUrl: item.recordingUrl,
          executiveSummary: item.executiveSummary,
          aiSummary: Array.isArray(item.keyTakeaways) && item.keyTakeaways.length > 0
            ? item.keyTakeaways
            : ['Mastered core concepts and problem-solving strategies collaboratively.'],
          actionItems: item.actionItems || [],
          keyEquations: item.keyEquations || [],
          flashcards: item.flashcards || [],
          sharedFiles: item.sharedFiles || [],
          slides: Array.isArray(item.slides) && item.slides.length > 0
            ? item.slides
            : generateFallbackSlides(item),
          whiteboardPages: Array.isArray(item.whiteboardPages) ? item.whiteboardPages : [],
          transcript: Array.isArray(item.transcriptEntries)
            ? item.transcriptEntries.map((e: any) => ({
                time: e.timeFormatted || '00:00',
                speaker: e.speakerName || 'Speaker',
                text: e.text || '',
                role: e.role || 'student',
              }))
            : [],
        }))

        const existingIds = new Set(backendRecords.map((r) => r.roomId || r.id))
        const nonDuplicatedSamples = SAMPLE_RECORDINGS.filter((s) => !existingIds.has(s.roomId) && !existingIds.has(s.id))
        setRecordings([...backendRecords, ...nonDuplicatedSamples])
      }
    } catch (err) {
      console.warn('[Recordings Page] Fallback to cached session recaps', err)
    } finally {
      setTimeout(() => {
        setIsLoading(false)
        setIsRefreshing(false)
      }, 200)
    }
  }, [])

  useEffect(() => {
    loadUserRecaps()
  }, [loadUserRecaps])

  // Auto-select room from query parameter (?room=...) directly on page
  useEffect(() => {
    if (roomQuery && recordings.length > 0) {
      const match = recordings.find((r) => r.roomId === roomQuery || r.id === roomQuery)
      if (match) {
        setSelectedRecord(match)
        setStudioTab('briefing')
        setActiveSlideIndex(0)
        setRevealedFlashcards(new Set())
      }
    }
  }, [roomQuery, recordings])

  const selectSessionOnPage = (rec: SessionRecord, playVideo = false) => {
    setSelectedRecord(rec)
    setIsPlayingVideo(playVideo)
    setStudioTab('briefing')
    setActiveSlideIndex(0)
    setRevealedFlashcards(new Set())
    if (rec.roomId) {
      setSearchParams({ room: rec.roomId })
    }
    // Smooth scroll down to the in-page active session studio
    setTimeout(() => {
      studioRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
  }

  const clearSelectedSession = () => {
    setSelectedRecord(null)
    setIsPlayingVideo(false)
    setSearchParams({})
  }

  const handleDownloadCurrentWhiteboardPage = () => {
    if (!selectedRecord) return
    const pages = getRecordWhiteboardPages(selectedRecord)
    const cur = pages[activeSlideIndex] || pages[0]
    if (cur) {
      downloadSingleWhiteboardPage(cur, activeSlideIndex, selectedRecord.title)
    }
  }

  const handleDownloadAllWhiteboardPages = () => {
    if (!selectedRecord) return
    const pages = getRecordWhiteboardPages(selectedRecord)
    if (pages.length === 0) {
      toast.error('No whiteboard pages available to download')
      return
    }
    downloadAllWhiteboardPages(pages, selectedRecord.title)
  }

  const toggleFlashcard = (index: number) => {
    setRevealedFlashcards((prev) => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  const toggleActionItem = (index: number) => {
    setCompletedActions((prev) => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate()
  const getFirstDayOfWeek = (year: number, month: number) => new Date(year, month, 1).getDay()

  const handlePrevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarMonth(11)
      setCalendarYear((prev) => prev - 1)
    } else {
      setCalendarMonth((prev) => prev - 1)
    }
  }

  const handleNextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarMonth(0)
      setCalendarYear((prev) => prev + 1)
    } else {
      setCalendarMonth((prev) => prev + 1)
    }
  }

  const filteredRecordings = recordings
    .filter((r) => {
      const matchesSubject = activeSubject === 'All' || r.subject === activeSubject
      const matchesDate = selectedDateFilter === 'All' || r.date === selectedDateFilter
      const matchesSearch =
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.tutorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.date.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.aiSummary.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (r.executiveSummary && r.executiveSummary.toLowerCase().includes(searchQuery.toLowerCase()))
      return matchesSubject && matchesDate && matchesSearch
    })
    .sort((a, b) => {
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB
    })

  const triggerBlobDownload = (filename: string, content: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleDownloadStudyGuide = (record: SessionRecord) => {
    const filename = `${record.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_Socratic_Study_Guide.md`
    const studentsList = getRecordStudents(record).join(', ')
    const content = `# 📚 Socratic AI Lesson Study Guide: ${record.title}
**Subject**: ${record.subject}
**Date**: ${record.date} | **Duration**: ${record.duration}
**Tutor**: ${record.tutorName}
**${getRecordStudents(record).length > 1 ? 'Learners' : 'Learner'}**: ${studentsList || record.studentName || 'Student'}

---

## 🎯 Executive Summary
${record.executiveSummary || 'No executive summary recorded for this session.'}

## 💡 Concepts & Principles Mastered
${record.aiSummary.map((s) => `- ${s}`).join('\n')}

## 📐 Key Equations & Mathematical Formulations
${
  record.keyEquations && record.keyEquations.length > 0
    ? record.keyEquations.map((eq) => `$$ ${eq} $$`).join('\n\n')
    : 'No formal mathematical equations recorded.'
}

## ✅ Recommended Practice & Homework Checklist
${
  record.actionItems && record.actionItems.length > 0
    ? record.actionItems.map((item) => `- [ ] ${item}`).join('\n')
    : 'No specific homework items assigned. Continue topic practice!'
}

## 🎴 Socratic Active-Recall Flashcards
${
  record.flashcards && record.flashcards.length > 0
    ? record.flashcards
        .map(
          (fc, idx) => `### Flashcard ${idx + 1}
**Question**: ${fc.question}
**Answer / Principle**: ${fc.answer}
`
        )
        .join('\n')
    : 'No flashcards generated for this session.'
}

## 💬 Dialogue Transcript
${
  record.transcript && record.transcript.length > 0
    ? record.transcript
        .map((t) => `[${t.time}] ${t.speaker} (${t.role || 'Participant'}): ${t.text}`)
        .join('\n')
    : 'No spoken dialogue transcribed.'
}

---
*Generated automatically by SOCRATES AI Learning Intelligence Vault*
`
    triggerBlobDownload(filename, content, 'text/markdown;charset=utf-8')
    toast.success(`Downloaded Socratic Study Guide for "${record.title}" (.md)!`)
  }



  const handleDownloadVideo = (record: SessionRecord) => {
    if (!record.videoUrl || record.videoUrl === '#') {
      toast.error('No downloadable video file URL found for this session.')
      return
    }
    const a = document.createElement('a')
    a.href = record.videoUrl
    a.download = `${record.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_Recording.mp4`
    a.target = '_blank'
    a.rel = 'noreferrer'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    toast.success(`Starting download for "${record.title}" session video (.mp4)...`)
  }

  const handleDownloadSingleFile = (file: SharedFile) => {
    if (!file.url || file.url === '#') {
      const content = `Sample Resource File: ${file.name}\nShared in SOCRATES Study Room session.\nUploaded by: ${file.uploadedBy || 'Tutor'}`
      triggerBlobDownload(file.name, content, 'text/plain;charset=utf-8')
      toast.success(`Downloaded "${file.name}"!`)
      return
    }
    const a = document.createElement('a')
    a.href = file.url
    a.download = file.name
    a.target = '_blank'
    a.rel = 'noreferrer'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    toast.success(`Downloading resource "${file.name}"...`)
  }



  return (
    <div className="w-full flex-1 flex flex-col font-sans selection:bg-[#0066cc]/10 antialiased">
      {/* Hero Showcase */}
      <section className="relative bg-gradient-to-b from-[#fbfbfd] via-[#f5f5f7] to-[#fafafc] border-b border-[#e5e5e7] pt-10 sm:pt-14 pb-5 sm:pb-6 px-6 overflow-hidden transform-gpu subpixel-antialiased">
        <div
          className="absolute inset-0 pointer-events-none flex items-start justify-center"
          aria-hidden="true"
        >
          <div className="w-[900px] h-[480px] bg-radial from-[#0066cc]/[0.05] via-transparent to-transparent rounded-full blur-3xl transform-gpu" />
        </div>

        <div className="absolute top-10 left-1/5 w-72 h-72 bg-[#0066cc]/5 rounded-full blur-3xl pointer-events-none transform-gpu" />
        <div className="absolute bottom-4 right-1/5 w-80 h-80 bg-[#0077ed]/5 rounded-full blur-3xl pointer-events-none transform-gpu" />

        <div className="max-w-4xl mx-auto relative z-10 text-center flex flex-col items-center">
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-display font-extrabold tracking-tight text-[#1d1d1f] leading-[1.08] transform-gpu">
            AI Session Recaps &amp;
            <span className="block mt-1 sm:mt-2 bg-gradient-to-r from-[#0066cc] via-[#0077ed] to-[#004499] bg-clip-text text-transparent pb-1">
              Study Intelligence Vault.
            </span>
          </h1>

          <p className="mt-5 max-w-2xl mx-auto text-base sm:text-lg text-[#6e6e73] font-normal leading-relaxed transform-gpu">
            Review your automated Socratic lesson summaries, practice with active-recall
            flashcards, inspect whiteboard derivations, and access interactive speech transcripts on this page.
          </p>

          <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full sm:w-auto transform-gpu">
            <Link
              to="/study-room/demo-101"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-full bg-[#0066cc] hover:bg-[#0077ed] active:bg-[#0052a3] text-white font-bold text-sm shadow-md shadow-[#0066cc]/20 transition-all duration-150 cursor-pointer select-none transform-gpu"
            >
              <Video size={16} className="shrink-0" />
              <span>Join Live Study Room</span>
            </Link>

            <button
              type="button"
              onClick={() => {
                document.getElementById('library-section')?.scrollIntoView({ behavior: 'smooth' })
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-full bg-white border border-[#e0e0e4] hover:border-[#0066cc]/40 hover:bg-[#0066cc]/5 text-[#1d1d1f] hover:text-[#0066cc] font-bold text-sm shadow-2xs transition-all duration-150 cursor-pointer select-none transform-gpu"
            >
              <FileText size={16} className="text-[#0066cc] shrink-0" />
              <span>Browse Saved Recaps ({recordings.length})</span>
            </button>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-2.5 text-xs select-none transform-gpu">
            <span className="px-4 py-2 rounded-full bg-white border border-[#e5e5e7] shadow-2xs text-[#525252] font-semibold flex items-center gap-1.5 transform-gpu">
              <Sparkles size={13} className="text-[#0066cc] shrink-0" />
              7-Section Socratic Recaps
            </span>
            <span className="px-4 py-2 rounded-full bg-white border border-[#e5e5e7] shadow-2xs text-[#525252] font-semibold flex items-center gap-1.5 transform-gpu">
              <Lightbulb size={13} className="text-[#0066cc] shrink-0" />
              Active Recall Flashcards
            </span>
            <span className="px-4 py-2 rounded-full bg-white border border-[#e5e5e7] shadow-2xs text-[#525252] font-semibold flex items-center gap-1.5 transform-gpu">
              <Sigma size={13} className="text-[#0066cc] shrink-0" />
              LaTeX Math Formulations
            </span>
            <span className="px-4 py-2 rounded-full bg-white border border-[#e5e5e7] shadow-2xs text-[#525252] font-semibold flex items-center gap-1.5 transform-gpu">
              <Download size={13} className="text-[#0066cc] shrink-0" />
              Instant PDF Notes
            </span>
          </div>
        </div>
      </section>

      {/* Main Body */}
      <main id="library-section" className="max-w-6xl mx-auto px-6 py-8 flex-1 w-full space-y-8">
        {/* IN-PAGE ACTIVE RECAP STUDIO (Displayed directly on this page without a new window/modal) */}
        {selectedRecord && (
          <div
            ref={studioRef}
            className="bg-white rounded-3xl border-2 border-[#0066cc]/30 shadow-xl overflow-hidden transition-all animate-in fade-in duration-200 transform-gpu"
          >
            {/* Active Studio Header Bar */}
            <div className="p-6 sm:p-8 bg-gradient-to-b from-[#f8faff] via-white to-white border-b border-[#e5e5e7]">
              {/* Top Navigation & Actions Bar */}
              <div className="flex items-center justify-between gap-4 mb-5">
                <button
                  type="button"
                  onClick={clearSelectedSession}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white hover:bg-[#f5f5f7] border border-[#e0e0e4] text-[#0066cc] text-xs font-bold transition-colors duration-150 cursor-pointer select-none shadow-2xs transform-gpu"
                >
                  <ArrowLeft size={14} className="shrink-0" />
                  <span>Back to All Sessions</span>
                </button>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleDownloadStudyGuide(selectedRecord)}
                    className="px-4 py-2 rounded-full bg-[#0066cc] hover:bg-[#0077ed] active:bg-[#0055b3] text-white text-xs font-bold transition-colors duration-150 shadow-xs flex items-center gap-2 cursor-pointer select-none transform-gpu shrink-0"
                    title="Download Formatted Socratic Study Guide"
                  >
                    <Download size={14} className="shrink-0" />
                    <span>Download Notes</span>
                  </button>
                </div>
              </div>

              {/* Main Title & Metadata Block */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-3 py-1 rounded-full bg-[#0066cc]/10 text-[#0066cc] font-bold text-xs border border-[#0066cc]/20 flex items-center gap-1.5">
                    {getSubjectFilterIcon(selectedRecord.subject, false)}
                    <span>{selectedRecord.subject}</span>
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-[#f5f5f7] border border-[#e5e5e7] text-[#6e6e73] text-xs font-medium flex items-center gap-1">
                    <Calendar size={12} className="text-[#86868b]" />
                    <span>{selectedRecord.date}</span>
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-[#f5f5f7] border border-[#e5e5e7] text-[#6e6e73] text-xs font-medium flex items-center gap-1">
                    <Clock size={12} className="text-[#86868b]" />
                    <span>{selectedRecord.duration}</span>
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-display font-extrabold text-[#1d1d1f] tracking-tight leading-tight">
                  {selectedRecord.title}
                </h2>

                <div className="flex items-center gap-3 pt-0.5 text-xs text-[#525252] font-semibold flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 select-none border border-[#e5e5e7] shadow-2xs bg-[#0066cc]">
                      <img
                        src={getTutorAvatar(selectedRecord.tutorName, selectedRecord.tutorAvatar)}
                        alt={selectedRecord.tutorName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            selectedRecord.tutorName
                          )}&background=0066cc&color=fff&size=128&bold=true`
                        }}
                      />
                    </div>
                    <span className="font-bold text-[#1d1d1f]">{selectedRecord.tutorName}</span>
                    <span className="text-[#86868b] font-normal">(Tutor)</span>
                  </div>
                  {getRecordStudents(selectedRecord).length > 0 && (
                    <>
                      <span className="text-[#d1d1d6]">•</span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[#86868b] font-normal">
                          {getRecordStudents(selectedRecord).length > 1 ? 'Learners:' : 'Learner:'}
                        </span>
                        {getRecordStudents(selectedRecord).map((student, idx, arr) => (
                          <span key={student} className="font-semibold text-[#1d1d1f]">
                            {student}{idx < arr.length - 1 ? ',' : ''}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* In-Page Studio Tabs */}
            <div className="flex items-center gap-2 px-6 pt-3.5 pb-2.5 bg-[#f5f5f7] border-b border-[#e5e5e7] overflow-x-auto scrollbar-none">
              <button
                type="button"
                onClick={() => setStudioTab('briefing')}
                className={`px-4 py-2 rounded-xl text-xs font-bold border cursor-pointer select-none flex items-center gap-1.5 shrink-0 transition-colors duration-150 transform-gpu ${
                  studioTab === 'briefing'
                    ? 'border-[#e5e5e7] bg-white text-[#0066cc] shadow-2xs'
                    : 'border-transparent text-[#6e6e73] hover:text-[#1d1d1f] hover:bg-white/60'
                }`}
              >
                <Sparkles size={14} className="text-[#0066cc]" />
                <span>Executive Briefing &amp; Key Concepts</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setStudioTab('slides')
                  setActiveSlideIndex(0)
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold border cursor-pointer select-none flex items-center gap-1.5 shrink-0 transition-colors duration-150 transform-gpu ${
                  studioTab === 'slides'
                    ? 'border-[#e5e5e7] bg-white text-[#0066cc] shadow-2xs'
                    : 'border-transparent text-[#6e6e73] hover:text-[#1d1d1f] hover:bg-white/60'
                }`}
              >
                <Presentation size={14} className="text-[#0066cc]" />
                <span>
                  Taught Whiteboard Pages ({getRecordWhiteboardPages(selectedRecord).length})
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStudioTab('flashcards')}
                className={`px-4 py-2 rounded-xl text-xs font-bold border cursor-pointer select-none flex items-center gap-1.5 shrink-0 transition-colors duration-150 transform-gpu ${
                  studioTab === 'flashcards'
                    ? 'border-[#e5e5e7] bg-white text-[#0066cc] shadow-2xs'
                    : 'border-transparent text-[#6e6e73] hover:text-[#1d1d1f] hover:bg-white/60'
                }`}
              >
                <Lightbulb size={14} className="text-[#0066cc]" />
                <span>Socratic Flashcards ({selectedRecord.flashcards?.length || 0})</span>
              </button>

              <button
                type="button"
                onClick={() => setStudioTab('checklist')}
                className={`px-4 py-2 rounded-xl text-xs font-bold border cursor-pointer select-none flex items-center gap-1.5 shrink-0 transition-colors duration-150 transform-gpu ${
                  studioTab === 'checklist'
                    ? 'border-[#e5e5e7] bg-white text-[#0066cc] shadow-2xs'
                    : 'border-transparent text-[#6e6e73] hover:text-[#1d1d1f] hover:bg-white/60'
                }`}
              >
                <ListTodo size={14} className="text-[#0066cc]" />
                <span>Homework &amp; Practice ({selectedRecord.actionItems?.length || 0})</span>
              </button>

              <button
                type="button"
                onClick={() => setStudioTab('transcript')}
                className={`px-4 py-2 rounded-xl text-xs font-bold border cursor-pointer select-none flex items-center gap-1.5 shrink-0 transition-colors duration-150 transform-gpu ${
                  studioTab === 'transcript'
                    ? 'border-[#e5e5e7] bg-white text-[#0066cc] shadow-2xs'
                    : 'border-transparent text-[#6e6e73] hover:text-[#1d1d1f] hover:bg-white/60'
                }`}
              >
                <Clock size={14} className="text-[#0066cc]" />
                <span>Dialogue Transcript ({selectedRecord.transcript.length})</span>
              </button>
            </div>

            {/* In-Page Studio Tab Content */}
            <div className="p-6 sm:p-8 bg-[#fafafc]">
              {studioTab === 'briefing' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Left Column: Video & Formulas (7 cols) */}
                  <div className="lg:col-span-7 space-y-6">
                    <div className="space-y-3">
                      <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-lg relative border border-[#2a2a2e] transform-gpu">
                        {isPlayingVideo ? (
                          <video
                            src={selectedRecord.videoUrl}
                            controls
                            autoPlay
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="relative w-full h-full">
                            <img src={selectedRecord.thumbnailUrl} alt={selectedRecord.title} className="w-full h-full object-cover opacity-85" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                            <button
                              type="button"
                              onClick={() => setIsPlayingVideo(true)}
                              className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-[#0066cc] hover:bg-[#0077ed] text-white flex items-center justify-center shadow-2xl ring-4 ring-white/40 transition-colors duration-150 cursor-pointer transform-gpu select-none"
                            >
                              <Play size={26} className="fill-white translate-x-[2px]" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Video Quick-Download Bar */}
                      <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-white border border-[#e5e5e7] shadow-2xs">
                        <div className="flex items-center gap-2 text-xs text-[#525252] font-semibold">
                          <Video size={15} className="text-[#0066cc] shrink-0" />
                          <span>{selectedRecord.fileSize || 'Full HD Recording'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleDownloadVideo(selectedRecord)}
                            className="px-3.5 py-1.5 rounded-xl bg-[#0066cc]/10 hover:bg-[#0066cc]/15 text-[#0066cc] font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer select-none"
                            title="Download Session Video (.mp4)"
                          >
                            <Download size={13} className="shrink-0" />
                            <span>Download Video (.mp4)</span>
                          </button>
                          {selectedRecord.thumbnailUrl && (
                            <a
                              href={selectedRecord.thumbnailUrl}
                              target="_blank"
                              rel="noreferrer"
                              download={`${selectedRecord.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_Snapshot.jpg`}
                              className="px-3 py-1.5 rounded-xl bg-[#f5f5f7] hover:bg-[#e8e8ed] text-[#525252] font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer select-none border border-[#e0e0e4]"
                              title="Download Board / Session Snapshot"
                            >
                              <ImageIcon size={13} className="shrink-0 text-[#86868b]" />
                              <span>Snapshot</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Key Equations Section */}
                    {selectedRecord.keyEquations && selectedRecord.keyEquations.length > 0 && (
                      <div className="bg-white rounded-2xl border border-[#e5e5e7] p-6 space-y-3 shadow-2xs">
                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#1d1d1f] flex items-center gap-2">
                          <Sigma size={16} className="text-[#0066cc]" />
                          <span>Key Equations &amp; Formulations</span>
                        </h4>
                        <div className="space-y-2.5">
                          {selectedRecord.keyEquations.map((eq, i) => (
                            <div key={i} className="p-3.5 rounded-xl bg-[#f8fafc] border border-[#e2e8f0] font-mono text-xs text-[#0f172a] font-bold flex items-center justify-between shadow-2xs">
                              <span className="truncate">{eq}</span>
                              <span className="text-[10px] font-mono text-[#0066cc] bg-[#0066cc]/10 px-2 py-0.5 rounded-md font-bold shrink-0">LaTeX</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Summaries & Shared Files (5 cols) */}
                  <div className="lg:col-span-5 space-y-6">
                    {/* Executive Summary */}
                    {selectedRecord.executiveSummary && (
                      <div className="bg-[#f0f6ff] rounded-2xl border border-[#d0e1fd] p-5 space-y-2 shadow-2xs">
                        <div className="flex items-center gap-2 text-xs font-extrabold text-[#0066cc] uppercase tracking-wider">
                          <Sparkles size={16} />
                          <span>Executive AI Summary</span>
                        </div>
                        <p className="text-xs sm:text-[13px] text-[#1e3a8a] leading-relaxed font-medium">
                          {selectedRecord.executiveSummary}
                        </p>
                      </div>
                    )}

                    {/* Key Concepts Mastered */}
                    <div className="bg-white rounded-2xl border border-[#e5e5e7] p-5 space-y-3 shadow-2xs">
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#1d1d1f] flex items-center gap-2">
                        <Check size={16} className="text-[#0066cc]" />
                        <span>Concepts Mastered</span>
                      </h4>
                      <ul className="space-y-2.5 text-xs text-[#525252] leading-relaxed">
                        {selectedRecord.aiSummary.map((item, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-[#0066cc] font-bold shrink-0">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Shared Files */}
                    {selectedRecord.sharedFiles && selectedRecord.sharedFiles.length > 0 && (
                      <div className="bg-white rounded-2xl border border-[#e5e5e7] p-5 space-y-3 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#1d1d1f] flex items-center gap-2">
                            <FolderDown size={15} className="text-[#0066cc]" />
                            <span>Shared Session Assets ({selectedRecord.sharedFiles.length})</span>
                          </h4>
                          <button
                            type="button"
                            onClick={() => {
                              selectedRecord.sharedFiles?.forEach((f, idx) => {
                                setTimeout(() => handleDownloadSingleFile(f), idx * 250)
                              })
                            }}
                            className="text-[11px] text-[#0066cc] hover:underline font-bold cursor-pointer"
                          >
                            Download All
                          </button>
                        </div>
                        <div className="space-y-2">
                          {selectedRecord.sharedFiles.map((file, i) => {
                            const isImage = file.name.endsWith('.png') || file.name.endsWith('.jpg') || file.name.endsWith('.webp')
                            const isPdf = file.name.endsWith('.pdf')
                            const isCode = file.name.endsWith('.py') || file.name.endsWith('.ts') || file.name.endsWith('.js')
                            return (
                              <div
                                key={i}
                                className="p-3 rounded-xl bg-[#f5f5f7] hover:bg-[#eef2f8] border border-[#e0e0e4] flex items-center justify-between text-xs transition-colors"
                              >
                                <div className="flex items-center gap-2.5 truncate mr-2">
                                  <div className="w-7 h-7 rounded-lg bg-white border border-[#e0e0e4] flex items-center justify-center text-[#0066cc] shrink-0">
                                    {isImage ? <ImageIcon size={14} /> : isPdf ? <FileText size={14} /> : isCode ? <FileCode size={14} /> : <FileDown size={14} />}
                                  </div>
                                  <div className="truncate">
                                    <p className="font-bold text-[#1d1d1f] truncate">{file.name}</p>
                                    {file.uploadedBy && (
                                      <p className="text-[10px] text-[#86868b]">Uploaded by {file.uploadedBy}</p>
                                    )}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleDownloadSingleFile(file)}
                                  className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-[#0066cc] text-[#0066cc] hover:text-white border border-[#e0e0e4] hover:border-[#0066cc] text-xs font-bold transition-all flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs"
                                  title={`Download ${file.name}`}
                                >
                                  <Download size={12} />
                                  <span>Save</span>
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {studioTab === 'slides' && (() => {
                const currentPages = getRecordWhiteboardPages(selectedRecord)
                const currentPage = currentPages[activeSlideIndex] || currentPages[0]

                if (currentPages.length === 0) {
                  return (
                    <div className="max-w-xl mx-auto py-12 text-center space-y-4">
                      <div className="w-14 h-14 rounded-2xl bg-[#0066cc]/10 text-[#0066cc] flex items-center justify-center mx-auto">
                        <Presentation size={26} />
                      </div>
                      <h4 className="text-lg font-bold text-[#1d1d1f]">No Whiteboard Pages Recorded</h4>
                      <p className="text-xs text-[#6e6e73]">
                        This session relied on oral discussion without digital whiteboard drawings.
                      </p>
                    </div>
                  )
                }

                return (
                  <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-200">
                    {/* Slides / Whiteboard Header & Navigation Controls */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-[#e5e5e7] shadow-2xs">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#0066cc]/10 border border-[#0066cc]/20 flex items-center justify-center text-[#0066cc] shrink-0">
                          <Presentation size={20} />
                        </div>
                        <div>
                          <h4 className="font-display text-base font-extrabold text-[#1d1d1f]">
                            Taught Lecture Slides &amp; Whiteboard Pages
                          </h4>
                          <p className="text-xs text-[#6e6e73]">
                            Original whiteboard drawings, diagrams, and equations taught during the live session.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
                        <button
                          type="button"
                          onClick={() => setActiveSlideIndex((prev) => Math.max(0, prev - 1))}
                          disabled={activeSlideIndex === 0}
                          className="p-2 rounded-xl border border-[#e5e5e7] bg-white hover:bg-[#f5f5f7] text-[#1d1d1f] disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
                          title="Previous Page"
                        >
                          <ChevronLeft size={16} />
                        </button>

                        <span className="px-3 py-1.5 rounded-xl bg-[#f5f5f7] border border-[#e5e5e7] text-xs font-mono font-bold text-[#1d1d1f] select-none">
                          Page {activeSlideIndex + 1} of {currentPages.length}
                        </span>

                        <button
                          type="button"
                          onClick={() => setActiveSlideIndex((prev) => Math.min(currentPages.length - 1, prev + 1))}
                          disabled={activeSlideIndex === currentPages.length - 1}
                          className="p-2 rounded-xl border border-[#e5e5e7] bg-white hover:bg-[#f5f5f7] text-[#1d1d1f] disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
                          title="Next Page"
                        >
                          <ChevronRight size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={handleDownloadCurrentWhiteboardPage}
                          className="px-3.5 py-2 rounded-xl border border-[#e5e5e7] bg-white hover:bg-[#f5f5f7] active:bg-[#ebebef] text-[#1d1d1f] text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer select-none"
                          title="Download Current Whiteboard Page as high-res PNG"
                        >
                          <Download size={13} />
                          <span>Save Page (.PNG)</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleDownloadAllWhiteboardPages}
                          className="px-4 py-2 rounded-xl bg-[#0066cc] hover:bg-[#0077ed] active:bg-[#0055b3] text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer select-none"
                          title="Download All Whiteboard Pages (.PNG)"
                        >
                          <Download size={13} />
                          <span>Download All Pages ({currentPages.length})</span>
                        </button>
                      </div>
                    </div>

                    {/* Main Whiteboard Canvas Display Viewport */}
                    {currentPage && (
                      <div className="bg-white rounded-3xl border border-[#e5e5e7] shadow-md overflow-hidden space-y-0">
                        {/* Slide Top Bar */}
                        <div className="px-6 py-4 border-b border-[#e5e5e7] bg-[#f8fafc] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <span className="px-2.5 py-1 rounded-lg bg-[#0066cc] text-white text-[11px] font-bold font-mono uppercase tracking-wider">
                              Page #{activeSlideIndex + 1}
                            </span>
                            <h5 className="font-display text-base font-bold text-[#1d1d1f]">
                              {currentPage.title || `Whiteboard Canvas Page ${activeSlideIndex + 1}`}
                            </h5>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-[#6e6e73]">
                              Taught by <strong className="text-[#1d1d1f]">{selectedRecord.tutorName}</strong>
                            </span>
                            <span className="text-[11px] font-mono text-[#6e6e73] bg-white border border-[#e0e0e4] px-2 py-0.5 rounded-md">
                              1920 × 1080 HD Canvas
                            </span>
                          </div>
                        </div>

                        {/* Direct Whiteboard Canvas Viewer */}
                        <div className="p-4 sm:p-6 bg-[#f5f5f7]">
                          <WhiteboardCanvasViewer page={currentPage} />
                        </div>

                        {/* Thumbnail Selector Rail with Mini Previews */}
                        <div className="px-6 py-4 bg-[#fbfbfd] border-t border-[#e5e5e7]">
                          <div className="text-[11px] font-bold text-[#6e6e73] uppercase tracking-wider mb-2.5 flex items-center justify-between">
                            <span>Whiteboard Navigation ({currentPages.length} Pages)</span>
                            <span>Click any page to showcase</span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {currentPages.map((page, pIdx) => (
                              <MiniCanvasThumbnail
                                key={page.id || pIdx}
                                page={page}
                                pageNumber={pIdx + 1}
                                isSelected={pIdx === activeSlideIndex}
                                onClick={() => setActiveSlideIndex(pIdx)}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })()}

              {studioTab === 'flashcards' && (
                <div className="max-w-3xl mx-auto space-y-6">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <h4 className="font-display text-lg font-bold text-[#1d1d1f]">Socratic Active-Recall Flashcards</h4>
                      <p className="text-xs text-[#6e6e73]">Click any card to reveal or hide the verified principle and solution.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (revealedFlashcards.size === (selectedRecord.flashcards?.length || 0)) {
                          setRevealedFlashcards(new Set())
                        } else {
                          setRevealedFlashcards(new Set(selectedRecord.flashcards?.map((_, i) => i) || []))
                        }
                      }}
                      className="px-4 py-2 rounded-xl bg-[#f5f5f7] hover:bg-[#e8e8ed] text-[#1d1d1f] text-xs font-bold border border-[#e0e0e4] transition-colors cursor-pointer select-none"
                    >
                      {revealedFlashcards.size === (selectedRecord.flashcards?.length || 0) ? 'Hide All Answers' : 'Reveal All Answers'}
                    </button>
                  </div>

                  <div className="space-y-4">
                    {selectedRecord.flashcards && selectedRecord.flashcards.length > 0 ? (
                      selectedRecord.flashcards.map((card, idx) => {
                        const isRevealed = revealedFlashcards.has(idx)
                        return (
                          <div
                            key={idx}
                            onClick={() => toggleFlashcard(idx)}
                            className="bg-white rounded-2xl border border-[#e5e5e7] hover:border-[#0066cc]/40 p-6 shadow-2xs cursor-pointer transition-colors duration-150 select-none"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="space-y-1.5 flex-1 min-w-0">
                                <div>
                                  <span className="text-[11px] font-bold text-[#0066cc] uppercase tracking-wider">
                                    Flashcard {idx + 1}
                                  </span>
                                </div>
                                <h5 className="text-sm sm:text-base font-bold text-[#1d1d1f] leading-snug">
                                  {card.question}
                                </h5>
                              </div>
                              <div className="w-8 h-8 rounded-xl bg-[#f5f5f7] text-[#0066cc] flex items-center justify-center shrink-0 transition-colors duration-150">
                                {isRevealed ? <EyeOff size={16} /> : <Eye size={16} />}
                              </div>
                            </div>

                            {/* Smooth Unfolding Answer (Zero Jiggle & Stutter) */}
                            <div
                              className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out ${
                                isRevealed
                                  ? 'grid-rows-[1fr] opacity-100 mt-4'
                                  : 'grid-rows-[0fr] opacity-0 mt-0 pointer-events-none'
                              }`}
                            >
                              <div className="overflow-hidden">
                                <div className="p-4 rounded-xl bg-[#f0fdf4] border border-[#bbf7d0] text-xs text-[#166534] leading-relaxed font-medium">
                                  <div className="font-bold uppercase tracking-wider text-[10px] text-[#15803d] mb-1">
                                    Verified Principle &amp; Answer
                                  </div>
                                  <p className="m-0 text-xs sm:text-[13px] leading-relaxed">{card.answer}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <div className="text-center py-12 text-[#86868b] text-xs font-semibold">
                        No flashcards available for this session.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {studioTab === 'checklist' && (
                <div className="max-w-3xl mx-auto space-y-6">
                  <div>
                    <h4 className="font-display text-lg font-bold text-[#1d1d1f]">Recommended Practice &amp; Homework Checklist</h4>
                    <p className="text-xs text-[#6e6e73]">Track your post-session reinforcement and assignment tasks on this page.</p>
                  </div>

                  <div className="bg-white rounded-2xl border border-[#e5e5e7] p-6 space-y-3 shadow-2xs">
                    {selectedRecord.actionItems && selectedRecord.actionItems.length > 0 ? (
                      selectedRecord.actionItems.map((item, idx) => {
                        const isDone = completedActions.has(idx)
                        return (
                          <div
                            key={idx}
                            onClick={() => toggleActionItem(idx)}
                            className={`p-4 rounded-xl border flex items-start gap-3 cursor-pointer transition-colors duration-150 select-none ${
                              isDone
                                ? 'bg-[#f0fdf4] border-[#bbf7d0] text-[#166534]'
                                : 'bg-[#fafafc] hover:bg-[#f5f5f7] border-[#e5e5e7] text-[#1d1d1f]'
                            }`}
                          >
                            <div className="mt-0.5 shrink-0">
                              {isDone ? (
                                <CheckSquare size={18} className="text-[#166534]" />
                              ) : (
                                <Square size={18} className="text-[#86868b]" />
                              )}
                            </div>
                            <span className={`text-xs font-medium leading-relaxed ${isDone ? 'line-through opacity-80' : ''}`}>
                              {item}
                            </span>
                          </div>
                        )
                      })
                    ) : (
                      <div className="text-center py-8 text-[#86868b] text-xs font-semibold">
                        No specific action items listed. Continue general topic practice!
                      </div>
                    )}
                  </div>
                </div>
              )}

              {studioTab === 'transcript' && (
                <div className="max-w-3xl mx-auto space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#e5e5e7] flex-wrap gap-2">
                    <div>
                      <h4 className="font-display text-base font-bold text-[#1d1d1f]">Session Dialogue</h4>
                      <p className="text-xs text-[#6e6e73]">Interactive back-and-forth Socratic conversation</p>
                    </div>
                    <span className="text-xs font-semibold text-[#0066cc] bg-[#0066cc]/10 px-3 py-1 rounded-full">
                      {selectedRecord.transcript.length} Dialogue Turns
                    </span>
                  </div>

                  <div className="space-y-4 max-h-[480px] overflow-y-auto pr-2 py-2">
                    {selectedRecord.transcript.length > 0 ? (
                      selectedRecord.transcript.map((t, idx) => {
                        const isTutor =
                          t.role === 'tutor' ||
                          t.speaker.toLowerCase().includes('dr.') ||
                          t.speaker.toLowerCase().includes('prof') ||
                          t.speaker === selectedRecord.tutorName

                        const initials = t.speaker
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .substring(0, 2)
                          .toUpperCase()

                        return (
                          <div
                            key={idx}
                            className={`flex items-start gap-3 ${isTutor ? '' : 'flex-row-reverse'}`}
                          >
                            {/* Avatar / Initials */}
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 shadow-2xs select-none ${
                                isTutor ? 'bg-[#0066cc] text-white' : 'bg-[#1d1d1f] text-white'
                              }`}
                            >
                              {initials || (isTutor ? 'TU' : 'ST')}
                            </div>

                            {/* Dialogue Bubble */}
                            <div className={`max-w-[82%] space-y-1 ${isTutor ? '' : 'items-end'}`}>
                              <div
                                className={`flex items-center gap-2 text-[11px] font-semibold text-[#6e6e73] ${
                                  isTutor ? '' : 'justify-end'
                                }`}
                              >
                                <span className="text-[#1d1d1f] font-bold">{t.speaker}</span>
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider ${
                                    isTutor
                                      ? 'bg-[#0066cc]/10 text-[#0066cc]'
                                      : 'bg-[#f0f0f2] text-[#525252]'
                                  }`}
                                >
                                  {isTutor ? 'Tutor' : 'Student'}
                                </span>
                                <span className="font-mono text-[10px] text-[#86868b]">{t.time}</span>
                              </div>

                              <div
                                className={`p-3.5 rounded-2xl text-xs sm:text-[13px] leading-relaxed select-text ${
                                  isTutor
                                    ? 'bg-white border border-[#e5e5e7] text-[#1d1d1f] shadow-2xs rounded-tl-xs text-left'
                                    : 'bg-[#0066cc] text-white shadow-2xs rounded-tr-xs text-left'
                                }`}
                              >
                                {t.text}
                              </div>
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <div className="text-center py-12 text-[#86868b] text-xs font-semibold">
                        No live dialogue transcribed for this session yet.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Integrated Search, Date & Subject Control Panel */}
        <div className="bg-white rounded-3xl border border-[#e5e5e7] p-4 sm:p-5 space-y-4 shadow-2xs">
          {/* Top Control Bar: Search Input + Date Filter + Sort Order */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Search Input Box */}
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#a1a1a6]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search recaps by topic, tutor name, date, equation, or keyword..."
                className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-[#f5f5f7] border border-transparent text-xs font-semibold outline-none focus:bg-white focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/10 transition-colors select-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a1a1a6] hover:text-[#1d1d1f] p-1 cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Side Filters: Calendar Popover + Sort Order */}
            <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap relative">
              {/* Calendar Trigger */}
              <div className="relative flex-1 sm:flex-none">
                <button
                  type="button"
                  onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                  className={`w-full sm:w-[210px] min-w-[210px] px-4 py-2.5 rounded-2xl border text-xs font-semibold flex items-center justify-between transition-all cursor-pointer select-none shadow-2xs shrink-0 whitespace-nowrap group ${
                    selectedDateFilter !== 'All'
                      ? 'bg-[#0066cc]/10 border-[#0066cc] text-[#0066cc]'
                      : 'bg-[#f5f5f7] hover:bg-[#e8e8ed] border-[#e0e0e4] hover:border-[#0066cc]/40 text-[#1d1d1f]'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Calendar size={15} className={`text-[#0066cc] shrink-0 transition-transform duration-200 group-hover:scale-110 ${isCalendarOpen ? 'scale-110' : ''}`} />
                    <span className="truncate">{selectedDateFilter === 'All' ? 'Filter by Session Date' : selectedDateFilter}</span>
                  </div>
                  <ChevronDown size={14} className={`text-[#6e6e73] shrink-0 ml-1 transition-transform duration-200 group-hover:text-[#0066cc] ${isCalendarOpen ? 'rotate-180 text-[#0066cc]' : ''}`} />
                </button>

                {/* Interactive Calendar Popover */}
                {isCalendarOpen && (
                  <div className="absolute left-1/2 -translate-x-1/2 top-12 z-50 w-80 bg-white rounded-3xl border border-[#e5e5e7] shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150 transform-gpu select-none">
                    <div className="flex items-center justify-between pb-2 border-b border-[#f0f0f2]">
                      <div className="flex items-center gap-2">
                        <span className="font-display text-sm font-extrabold text-[#1d1d1f]">
                          {monthNames[calendarMonth]} {calendarYear}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={handlePrevMonth}
                          className="p-1.5 rounded-xl hover:bg-[#f5f5f7] text-[#525252] hover:text-[#1d1d1f] transition-colors cursor-pointer"
                          title="Previous Month"
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={handleNextMonth}
                          className="p-1.5 rounded-xl hover:bg-[#f5f5f7] text-[#525252] hover:text-[#1d1d1f] transition-colors cursor-pointer"
                          title="Next Month"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-7 text-center text-[11px] font-bold text-[#86868b]">
                      {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                        <div key={d}>{d}</div>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-center text-xs">
                      {Array.from({ length: getFirstDayOfWeek(calendarYear, calendarMonth) }).map((_, i) => (
                        <div key={`empty-${i}`} className="h-8" />
                      ))}

                      {Array.from({ length: getDaysInMonth(calendarYear, calendarMonth) }).map((_, i) => {
                        const dayNum = i + 1
                        const shortMonth = monthNames[calendarMonth].substring(0, 3)
                        const fullDateStr = `${shortMonth} ${dayNum}, ${calendarYear}`

                        const today = new Date()
                        const isToday =
                          dayNum === today.getDate() &&
                          calendarMonth === today.getMonth() &&
                          calendarYear === today.getFullYear()

                        const hasRecording = recordings.some((r) => r.date === fullDateStr)
                        const isSelected = selectedDateFilter === fullDateStr || (selectedDateFilter === 'All' && isToday)

                        return (
                          <button
                            key={dayNum}
                            type="button"
                            onClick={() => {
                              setSelectedDateFilter(selectedDateFilter === fullDateStr ? 'All' : fullDateStr)
                              setIsCalendarOpen(false)
                            }}
                            className={`h-8 rounded-xl flex items-center justify-center font-bold text-xs transition-colors cursor-pointer select-none ${
                              isSelected
                                ? 'bg-[#0066cc] text-white border border-[#0066cc] shadow-2xs'
                                : hasRecording
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-300/80 hover:bg-emerald-100'
                                : 'text-[#1d1d1f] hover:bg-[#f5f5f7] border border-transparent'
                            }`}
                          >
                            <span>{dayNum}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Sort Order Dropdown */}
              <div className="relative flex-1 sm:flex-none">
                <button
                  type="button"
                  onClick={() => setIsSortOpen(!isSortOpen)}
                  className="w-full sm:w-[185px] min-w-[185px] px-4 py-2.5 rounded-2xl bg-[#f5f5f7] hover:bg-[#e8e8ed] border border-[#e0e0e4] hover:border-[#0066cc]/40 text-xs font-semibold text-[#1d1d1f] flex items-center justify-between transition-all cursor-pointer select-none shadow-2xs shrink-0 whitespace-nowrap group"
                >
                  <div className="flex items-center gap-2 truncate">
                    <Filter size={14} className={`text-[#0066cc] shrink-0 transition-transform duration-200 group-hover:scale-110 ${isSortOpen ? 'scale-110' : ''}`} />
                    <span className="truncate">{sortOrder === 'newest' ? 'Sort: Newest First' : 'Sort: Oldest First'}</span>
                  </div>
                  <ChevronDown size={14} className={`text-[#6e6e73] shrink-0 ml-1 transition-transform duration-200 group-hover:text-[#0066cc] ${isSortOpen ? 'rotate-180 text-[#0066cc]' : ''}`} />
                </button>

                {isSortOpen && (
                  <div className="absolute left-1/2 -translate-x-1/2 top-12 z-50 w-52 bg-white rounded-2xl border border-[#e5e5e7] shadow-xl p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-150 transform-gpu select-none">
                    <button
                      type="button"
                      onClick={() => {
                        setSortOrder('newest')
                        setIsSortOpen(false)
                      }}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                        sortOrder === 'newest'
                          ? 'bg-[#0066cc]/10 text-[#0066cc]'
                          : 'text-[#1d1d1f] hover:bg-[#f5f5f7]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <ArrowDownWideNarrow size={15} className="text-[#0066cc]" />
                        <span>Newest First</span>
                      </div>
                      {sortOrder === 'newest' && <Check size={14} className="text-[#0066cc]" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSortOrder('oldest')
                        setIsSortOpen(false)
                      }}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                        sortOrder === 'oldest'
                          ? 'bg-[#0066cc]/10 text-[#0066cc]'
                          : 'text-[#1d1d1f] hover:bg-[#f5f5f7]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <ArrowUpNarrowWide size={15} className="text-[#0066cc]" />
                        <span>Oldest First</span>
                      </div>
                      {sortOrder === 'oldest' && <Check size={14} className="text-[#0066cc]" />}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Control Bar: Subject Filter Pills + Clear Button */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-none border-t border-[#f0f0f2] pt-3">
            <div className="flex items-center gap-2">
              {['All', 'Mathematics', 'Computer Science', 'Physics'].map((subj) => {
                const isActive = activeSubject === subj
                return (
                  <button
                    key={subj}
                    onClick={() => setActiveSubject(subj)}
                    className={`px-4 py-2 rounded-2xl text-xs font-bold transition-colors duration-150 cursor-pointer whitespace-nowrap select-none border flex items-center gap-2 transform-gpu ${
                      isActive
                        ? 'bg-[#0066cc] text-white border-[#0066cc] shadow-2xs'
                        : 'bg-white border-[#e0e0e2] text-[#525252] hover:border-[#0066cc]/40 hover:text-[#0066cc]'
                    }`}
                  >
                    {getSubjectFilterIcon(subj, isActive)}
                    <span>{subj}</span>
                  </button>
                )
              })}
            </div>

            {(selectedDateFilter !== 'All' || activeSubject !== 'All' || searchQuery !== '') && (
              <button
                type="button"
                onClick={() => {
                  setSelectedDateFilter('All')
                  setActiveSubject('All')
                  setSearchQuery('')
                  loadUserRecaps(true)
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#e5e5e7] hover:border-[#0066cc]/40 text-xs font-semibold text-[#525252] hover:text-[#0066cc] transition-all duration-150 shadow-2xs hover:shadow-xs cursor-pointer select-none shrink-0 transform-gpu leading-none"
              >
                <RotateCcw size={12} className={`text-[#0066cc] ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* Sessions Library Grid / List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-4 px-1 sm:px-2">
            <div className="flex items-center gap-2.5 select-none">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#0066cc] animate-pulse shrink-0" />
                <h2 className="text-sm sm:text-base font-bold text-[#1d1d1f] tracking-tight">
                  {selectedRecord ? 'All Sessions in Vault' : 'Saved Study Sessions'}
                </h2>
              </div>
              <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-[#0066cc]/10 text-[#0066cc] border border-[#0066cc]/20 font-extrabold text-xs">
                {filteredRecordings.length} Available
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {(activeSubject !== 'All' || searchQuery || selectedDateFilter !== 'All' || selectedRecord !== null) && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveSubject('All')
                    setSearchQuery('')
                    setSelectedDateFilter('All')
                    clearSelectedSession()
                    loadUserRecaps(true)
                    toast.success('Filters reset & sessions refreshed')
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#e5e5e7] hover:border-[#0066cc]/40 text-xs font-semibold text-[#525252] hover:text-[#0066cc] transition-all duration-150 shadow-2xs hover:shadow-xs cursor-pointer select-none shrink-0 transform-gpu leading-none"
                >
                  <RotateCcw size={12} className={`text-[#0066cc] ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span>Reset Filters</span>
                </button>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-6">
              {[1, 2, 3].map((n) => (
                <RecordingCardSkeleton key={n} />
              ))}
            </div>
          ) : filteredRecordings.length === 0 ? (
            <div className="bg-white rounded-3xl border border-[#e5e5e7] p-12 text-center space-y-3">
              <BookOpen size={36} className="mx-auto text-[#7a7a7a]" />
              <h3 className="text-lg font-display font-semibold text-[#1d1d1f]">No study sessions matched your criteria</h3>
              <p className="text-xs text-[#7a7a7a]">Try adjusting your search query or subject filters.</p>
              <button
                type="button"
                onClick={() => {
                  setActiveSubject('All')
                  setSearchQuery('')
                  setSelectedDateFilter('All')
                  loadUserRecaps(true)
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 mt-2 rounded-full bg-white border border-[#e5e5e7] hover:border-[#0066cc]/40 text-xs font-semibold text-[#0066cc] shadow-2xs hover:shadow-xs cursor-pointer select-none"
              >
                <RotateCcw size={12} className="text-[#0066cc]" />
                <span>Reset Filters</span>
              </button>
            </div>
          ) : (
            filteredRecordings.map((rec) => {
            const isCurrentlySelected = selectedRecord?.id === rec.id

            return (
              <div
                key={rec.id}
                onClick={() => selectSessionOnPage(rec)}
                className={`bg-white rounded-3xl border overflow-hidden shadow-xs hover:border-[#0066cc]/60 transition-all duration-150 cursor-pointer grid grid-cols-1 md:grid-cols-12 gap-0 group transform-gpu select-none ${
                  isCurrentlySelected
                    ? 'border-[#0066cc] ring-2 ring-[#0066cc]/20 shadow-md'
                    : 'border-[#e5e5e7]'
                }`}
              >
                {/* Left Column: Video Thumbnail Frame */}
                <div className="md:col-span-5 lg:col-span-4 relative aspect-video md:aspect-auto min-h-[260px] sm:min-h-[290px] bg-black overflow-hidden">
                  <img
                    src={rec.thumbnailUrl}
                    alt={rec.title}
                    className="w-full h-full object-cover opacity-95 group-hover:opacity-100 transition-opacity duration-150"
                  />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-white/95 text-[#0066cc] flex items-center justify-center shadow-2xl ring-4 ring-white/30 backdrop-blur-sm group-hover:bg-[#0066cc] group-hover:text-white transition-all duration-200 transform-gpu group-hover:scale-105 active:scale-95 select-none">
                      <Play size={24} className="fill-current translate-x-[1.5px] shrink-0" />
                    </div>
                  </div>

                  {/* Duration Badge */}
                  <div className="absolute bottom-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/80 backdrop-blur-md text-white text-xs font-display font-bold tracking-wide border border-white/25 shadow-md select-none">
                    <Clock size={13} className="text-white/90" />
                    <span>{rec.duration}</span>
                  </div>

                  {/* Subject Badge */}
                  <div className="absolute top-4 left-4 px-3.5 py-1.5 rounded-xl bg-white/95 backdrop-blur-md text-[#0066cc] text-xs font-bold shadow-xs border border-[#0066cc]/20 flex items-center gap-1.5">
                    {getSubjectFilterIcon(rec.subject, false)}
                    <span>{rec.subject}</span>
                  </div>
                </div>

                {/* Right Column: Information Body */}
                <div className="md:col-span-7 lg:col-span-8 p-7 sm:p-8 flex flex-col justify-between space-y-5">
                  <div className="space-y-4">
                    {/* Title & Instructor Info */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-display text-xl sm:text-2xl font-bold text-[#1d1d1f] group-hover:text-[#0066cc] transition-colors leading-snug tracking-tight">
                          {rec.title}
                        </h3>
                        {isCurrentlySelected && (
                          <span className="px-2.5 py-1 rounded-full bg-[#0066cc] text-white text-[10px] font-bold uppercase tracking-wider shrink-0">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2.5 text-xs font-semibold text-[#525252] flex-wrap">
                        <div className="inline-flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 select-none border border-[#e5e5e7] shadow-2xs bg-[#0066cc]">
                            <img
                              src={getTutorAvatar(rec.tutorName, rec.tutorAvatar)}
                              alt={rec.tutorName}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                  rec.tutorName
                                )}&background=0066cc&color=fff&size=128&bold=true`
                              }}
                            />
                          </div>
                          <span className="font-bold text-[#1d1d1f]">{rec.tutorName}</span>
                          <span className="text-[#86868b] font-normal">(Tutor)</span>
                        </div>
                        <span>•</span>
                        <span>{rec.date}</span>
                        {getRecordStudents(rec).length > 0 && (
                          <>
                            <span className="text-[#d1d1d6]">•</span>
                            <div className="flex items-center gap-1 flex-wrap">
                              <span className="text-[#86868b] font-normal">
                                {getRecordStudents(rec).length > 1 ? 'Learners:' : 'Learner:'}
                              </span>
                              <span className="font-semibold text-[#1d1d1f]">
                                {getRecordStudents(rec).join(', ')}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Socratic AI Summary */}
                    <div className="bg-[#f4f8fc] border border-[#0066cc]/15 rounded-2xl p-4.5 space-y-2 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-display text-xs font-bold text-[#0066cc] uppercase tracking-wider">
                          <Sparkles size={14} />
                          <span>Socrates AI Summary &amp; Key Concepts</span>
                        </div>
                        {rec.flashcards && rec.flashcards.length > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-[#0066cc]/10 text-[#0066cc] font-bold text-[10px]">
                            {rec.flashcards.length} Flashcards
                          </span>
                        )}
                      </div>
                      {rec.executiveSummary && (
                        <p className="text-xs text-[#1e3a8a] leading-relaxed font-medium line-clamp-2">
                          {rec.executiveSummary}
                        </p>
                      )}
                      <ul className="space-y-1 text-xs text-[#424245] leading-relaxed font-normal">
                        {rec.aiSummary.slice(0, 2).map((point, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-[#0066cc] font-bold shrink-0">•</span>
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Key Formula / Equation Tags */}
                    {rec.keyEquations && rec.keyEquations.length > 0 && (
                      <div className="flex flex-wrap gap-2 items-center pt-0.5">
                        <span className="font-display text-xs font-bold text-[#7a7a7a] uppercase tracking-wider">Formulas:</span>
                        {rec.keyEquations.map((eq, idx) => (
                          <span key={idx} className="px-3 py-1 rounded-xl bg-[#f5f5f7] border border-[#e0e0e5] font-mono text-xs text-[#1d1d1f] font-bold shadow-2xs">
                            {eq}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Bottom Action Footer Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-[#f0f0f2]">
                    <span className="text-xs font-semibold text-[#7a7a7a]">
                      {rec.fileSize || 'Full HD Recording'} • AI Transcript Ready
                    </span>

                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          selectSessionOnPage(rec, true)
                        }}
                        className="px-5 py-2.5 rounded-xl bg-[#0066cc] hover:bg-[#0077ed] active:bg-[#0055b3] text-white font-display text-xs font-bold transition-colors shadow-xs flex items-center gap-2 cursor-pointer select-none"
                      >
                        <Play size={14} className="fill-white" />
                        <span>Explore on this Page</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDownloadStudyGuide(rec)
                        }}
                        className="px-5 py-2.5 rounded-xl bg-[#f5f5f7] hover:bg-[#e8e8ed] text-[#0066cc] border border-[#e0e0e4] font-display text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer select-none"
                        title="Download Socratic Study Guide (.md)"
                      >
                        <Download size={14} />
                        <span>AI Notes (.md)</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          }))}
        </div>
      </main>
    </div>
  )
}
