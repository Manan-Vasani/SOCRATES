import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import {
  Sparkles,
  Flame,
  Trophy,
  BrainCircuit,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  Zap,
  BookOpen,
  Award,
  Layers,
  ChevronRight,
  Clock,
  HelpCircle,
  Share2,
} from 'lucide-react'
import { toast } from 'sonner'

interface Question {
  id: number
  subject: string
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Olympiad'
  question: string
  options: string[]
  correctIndex: number
  explanation: string
}

const SAMPLE_QUESTIONS: Question[] = [
  {
    id: 1,
    subject: 'Mathematics',
    difficulty: 'Medium',
    question: 'What is the derivative of f(x) = x^3 \\cdot \\sin(x) with respect to x?',
    options: [
      '3x^2 \\cdot \\sin(x) + x^3 \\cdot \\cos(x)',
      '3x^2 \\cdot \\cos(x)',
      'x^3 \\cdot \\cos(x) - 3x^2 \\cdot \\sin(x)',
      '3x^2 \\cdot \\sin(x) - x^3 \\cdot \\cos(x)',
    ],
    correctIndex: 0,
    explanation:
      'Using the Product Rule: (u \\cdot v)\' = u\'v + uv\'. Here, u = x^3 (u\' = 3x^2) and v = \\sin(x) (v\' = \\cos(x)). Thus, f\'(x) = 3x^2 \\cdot \\sin(x) + x^3 \\cdot \\cos(x).',
  },
  {
    id: 2,
    subject: 'Computer Science',
    difficulty: 'Medium',
    question: 'What is the average time complexity of searching in a balanced Binary Search Tree (AVL / Red-Black)?',
    options: ['O(1)', 'O(\\log n)', 'O(n)', 'O(n \\log n)'],
    correctIndex: 1,
    explanation:
      'Because the height of a balanced Binary Search Tree is strictly bounded by O(\\log n), search operations visit at most one node per level, yielding an average and worst-case time complexity of O(\\log n).',
  },
  {
    id: 3,
    subject: 'Physics',
    difficulty: 'Hard',
    question: 'According to Special Relativity, what happens to the relativistic mass of an object as its speed approaches c?',
    options: [
      'It approaches zero',
      'It remains constant',
      'It approaches infinity',
      'It oscillates sinusoidally',
    ],
    correctIndex: 2,
    explanation:
      'Relativistic mass is given by m = m_0 / \\sqrt{1 - v^2/c^2}. As v \\to c, the denominator approaches zero, causing the relativistic mass m to approach infinity.',
  },
  {
    id: 4,
    subject: 'Mathematics',
    difficulty: 'Olympiad',
    question: 'Evaluate the definite integral: \\int_{0}^{\\pi/2} \\frac{\\sin(x)}{\\sin(x) + \\cos(x)} \\, dx.',
    options: ['\\pi/4', '\\pi/2', '1', '\\pi/8'],
    correctIndex: 0,
    explanation:
      'Let I = \\int_{0}^{\\pi/2} \\frac{\\sin(x)}{\\sin(x) + \\cos(x)} dx. Using King\'s Property (substituting x with \\pi/2 - x), I = \\int_{0}^{\\pi/2} \\frac{\\cos(x)}{\\cos(x) + \\sin(x)} dx. Adding both yields 2I = \\int_{0}^{\\pi/2} 1 \\, dx = \\pi/2 \\implies I = \\pi/4.',
  },
]

interface Flashcard {
  id: number
  subject: string
  concept: string
  formula: string
  hint: string
}

const FLASHCARDS: Flashcard[] = [
  {
    id: 1,
    subject: 'Mathematics',
    concept: 'Chain Rule for Differentiation',
    formula: '\\frac{d}{dx}[f(g(x))] = f\'(g(x)) \\cdot g\'(x)',
    hint: 'Differentiate outer function evaluated at inner function, then multiply by inner derivative.',
  },
  {
    id: 2,
    subject: 'Physics',
    concept: 'Euler-Lagrange Equation',
    formula: '\\frac{d}{dt} \\left( \\frac{\\partial L}{\\partial \\dot{q}_i} \\right) - \\frac{\\partial L}{\\partial q_i} = 0',
    hint: 'L = T - V. Fundamental equation of motion in classical Lagrangian mechanics.',
  },
  {
    id: 3,
    subject: 'Computer Science',
    concept: 'Master Theorem for Divide & Conquer',
    formula: 'T(n) = aT(n/b) + f(n)',
    hint: 'Compares f(n) against n^{\\log_b a} to solve recurrence relations.',
  },
]

const LEADERBOARD = [
  { rank: 1, name: 'Dr. Alex Vance', xp: 14200, streak: 28, badge: 'Grandmaster' },
  { rank: 2, name: 'Manan Vasani', xp: 12450, streak: 14, badge: 'AI Scholar' },
  { rank: 3, name: 'Elena Rostova', xp: 9800, streak: 12, badge: 'Calculus Pro' },
  { rank: 4, name: 'Marcus Chen', xp: 8400, streak: 9, badge: 'Code Ninja' },
  { rank: 5, name: 'Sarah Jenkins', xp: 7100, streak: 6, badge: 'Physics Enthusiast' },
]

export default function PracticePage() {
  const [activeTab, setActiveTab] = useState<'quiz' | 'flashcards' | 'leaderboard'>('quiz')
  const [selectedSubject, setSelectedSubject] = useState<string>('All')
  const [currentQIndex, setCurrentQIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false)
  const [userScore, setUserScore] = useState(0)
  const [userXp, setUserXp] = useState(2450)
  const [userStreak] = useState(7)

  // Flashcard states
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)

  const filteredQuestions = SAMPLE_QUESTIONS.filter(
    (q) => selectedSubject === 'All' || q.subject === selectedSubject
  )

  const currentQ = filteredQuestions[currentQIndex % filteredQuestions.length] || SAMPLE_QUESTIONS[0]
  const currentCard = FLASHCARDS[currentCardIndex % FLASHCARDS.length]

  const handleOptionClick = (idx: number) => {
    if (isAnswerSubmitted) return
    setSelectedOption(idx)
  }

  const handleSubmitAnswer = () => {
    if (selectedOption === null || isAnswerSubmitted) return
    setIsAnswerSubmitted(true)
    if (selectedOption === currentQ.correctIndex) {
      setUserScore((prev) => prev + 1)
      setUserXp((prev) => prev + 50)
      toast.success('+50 XP! Correct Answer 🎉')
    } else {
      toast.error('Incorrect. Review the AI explanation below.')
    }
  }

  const handleNextQuestion = () => {
    setSelectedOption(null)
    setIsAnswerSubmitted(false)
    setCurrentQIndex((prev) => prev + 1)
  }

  return (
    <div className="min-h-screen bg-[#fafafc] text-[#1d1d1f] flex flex-col font-sans selection:bg-[#0066cc]/10">
      <Navbar />

      {/* Hero / Header Section */}
      <section className="bg-white border-b border-[#e5e5e7] py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0066cc]/8 border border-[#0066cc]/15 text-[#0066cc] text-xs font-semibold">
              <BrainCircuit size={14} />
              <span>SOCRATES AI Practice Engine</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#1d1d1f]">
              Interactive Practice & Knowledge Hub
            </h1>
            <p className="text-sm text-[#6e6e73] max-w-xl">
              Sharpen your problem-solving skills with AI-generated quizzes, step-by-step mathematical derivations, and flashcards.
            </p>
          </div>

          {/* User Stats Card */}
          <div className="flex items-center gap-4 bg-[#f5f5f7] border border-[#e5e5e7] rounded-2xl p-4 shrink-0 shadow-2xs">
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#e0e0e2] shadow-2xs">
              <Flame size={18} className="text-orange-500 fill-orange-500 animate-pulse" />
              <div>
                <div className="text-[10px] uppercase font-bold text-[#86868b] tracking-wider">Streak</div>
                <div className="text-sm font-extrabold text-[#1d1d1f]">{userStreak} Days</div>
              </div>
            </div>

            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#e0e0e2] shadow-2xs">
              <Zap size={18} className="text-amber-500 fill-amber-500" />
              <div>
                <div className="text-[10px] uppercase font-bold text-[#86868b] tracking-wider">Total XP</div>
                <div className="text-sm font-extrabold text-[#0066cc]">{userXp} XP</div>
              </div>
            </div>

            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#e0e0e2] shadow-2xs">
              <Trophy size={18} className="text-purple-600" />
              <div>
                <div className="text-[10px] uppercase font-bold text-[#86868b] tracking-wider">Level</div>
                <div className="text-sm font-extrabold text-[#1d1d1f]">Lvl 12</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Body */}
      <main className="max-w-6xl mx-auto px-6 py-8 flex-1 w-full space-y-8">
        {/* Navigation Tabs & Subject Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e5e5e7] pb-4">
          <div className="flex items-center gap-2 bg-[#e8e8ed]/60 p-1 rounded-2xl border border-[#e0e0e2]">
            <button
              onClick={() => setActiveTab('quiz')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'quiz' ? 'bg-white text-[#0066cc] shadow-sm' : 'text-[#6e6e73] hover:text-[#1d1d1f]'
              }`}
            >
              <BrainCircuit size={15} />
              <span>AI Quiz Arena</span>
            </button>
            <button
              onClick={() => setActiveTab('flashcards')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'flashcards' ? 'bg-white text-[#0066cc] shadow-sm' : 'text-[#6e6e73] hover:text-[#1d1d1f]'
              }`}
            >
              <Layers size={15} />
              <span>Flashcard Hub</span>
            </button>
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'leaderboard' ? 'bg-white text-[#0066cc] shadow-sm' : 'text-[#6e6e73] hover:text-[#1d1d1f]'
              }`}
            >
              <Trophy size={15} />
              <span>Leaderboard</span>
            </button>
          </div>

          {/* Subject Filter Pills */}
          {activeTab === 'quiz' && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              {['All', 'Mathematics', 'Computer Science', 'Physics'].map((subj) => (
                <button
                  key={subj}
                  onClick={() => {
                    setSelectedSubject(subj)
                    setCurrentQIndex(0)
                    setSelectedOption(null)
                    setIsAnswerSubmitted(false)
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    selectedSubject === subj
                      ? 'bg-[#0066cc] text-white shadow-xs'
                      : 'bg-white border border-[#e0e0e2] text-[#6e6e73] hover:border-[#0066cc]/40 hover:text-[#1d1d1f]'
                  }`}
                >
                  {subj}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* TAB 1: AI QUIZ ARENA */}
        {activeTab === 'quiz' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Question Box */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-3xl border border-[#e5e5e7] p-6 md:p-8 shadow-sm relative overflow-hidden space-y-6">
                {/* Question Badge & Subject Info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-[#f0f0f2] text-xs font-semibold text-[#1d1d1f]">
                      {currentQ.subject}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        currentQ.difficulty === 'Easy'
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                          : currentQ.difficulty === 'Medium'
                          ? 'bg-amber-50 text-amber-600 border border-amber-200'
                          : currentQ.difficulty === 'Hard'
                          ? 'bg-red-50 text-red-600 border border-red-200'
                          : 'bg-purple-50 text-purple-600 border border-purple-200'
                      }`}
                    >
                      {currentQ.difficulty}
                    </span>
                  </div>
                  <span className="text-xs text-[#86868b] font-medium">Question {currentQIndex + 1} of {filteredQuestions.length}</span>
                </div>

                {/* Question Title */}
                <h3 className="text-lg md:text-xl font-bold text-[#1d1d1f] leading-snug">
                  {currentQ.question}
                </h3>

                {/* Multiple Choice Options */}
                <div className="space-y-3 pt-2">
                  {currentQ.options.map((opt, idx) => {
                    let btnStyle = 'bg-white border-[#e5e5e7] text-[#1d1d1f] hover:border-[#0066cc]/50 hover:bg-[#f5f5f7]'
                    if (selectedOption === idx) {
                      btnStyle = 'bg-[#0066cc]/8 border-[#0066cc] text-[#0066cc] ring-2 ring-[#0066cc]/20'
                    }
                    if (isAnswerSubmitted) {
                      if (idx === currentQ.correctIndex) {
                        btnStyle = 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-2 ring-emerald-500/20'
                      } else if (selectedOption === idx) {
                        btnStyle = 'bg-red-50 border-red-500 text-red-700 ring-2 ring-red-500/20'
                      }
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => handleOptionClick(idx)}
                        disabled={isAnswerSubmitted}
                        className={`w-full text-left p-4 rounded-2xl border text-sm font-medium transition-all flex items-center justify-between cursor-pointer ${btnStyle}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-full bg-[#f0f0f2] flex items-center justify-center text-xs font-bold text-[#6e6e73] shrink-0">
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span>{opt}</span>
                        </div>
                        {isAnswerSubmitted && idx === currentQ.correctIndex && (
                          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                        )}
                        {isAnswerSubmitted && selectedOption === idx && idx !== currentQ.correctIndex && (
                          <XCircle size={18} className="text-red-500 shrink-0" />
                        )}
                      </button>
                    )
                  })}
                </div>

                {/* Submit / Next Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-[#e5e5e7]">
                  <span className="text-xs text-[#86868b]">Select an answer and submit for instant AI validation.</span>
                  {!isAnswerSubmitted ? (
                    <button
                      onClick={handleSubmitAnswer}
                      disabled={selectedOption === null}
                      className="px-6 py-2.5 rounded-full bg-[#0066cc] text-white text-xs font-semibold hover:bg-[#0077ed] transition-all disabled:opacity-30 cursor-pointer shadow-md shadow-[#0066cc]/20"
                    >
                      Submit Answer
                    </button>
                  ) : (
                    <button
                      onClick={handleNextQuestion}
                      className="px-6 py-2.5 rounded-full bg-[#0066cc] text-white text-xs font-semibold hover:bg-[#0077ed] transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-[#0066cc]/20"
                    >
                      <span>Next Question</span>
                      <ArrowRight size={14} />
                    </button>
                  )}
                </div>

                {/* AI Explanation Walkthrough (after submit) */}
                {isAnswerSubmitted && (
                  <div className="bg-[#f0f7ff] border border-[#0066cc]/20 rounded-2xl p-5 space-y-2 animate-in fade-in duration-200">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#0066cc]">
                      <Sparkles size={15} />
                      <span>Socrates AI Explanation Walkthrough</span>
                    </div>
                    <p className="text-xs text-[#1d1d1f]/90 leading-relaxed font-mono">
                      {currentQ.explanation}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Side Panel: Study Room Quick Jump & Session Tips */}
            <div className="space-y-6">
              {/* Study Room CTA */}
              <div className="bg-gradient-to-br from-[#0066cc] to-indigo-700 text-white rounded-3xl p-6 shadow-xl space-y-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-10">
                  <Sparkles size={120} />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">Live Collaboration</span>
                  <h4 className="text-lg font-extrabold">Need Help From a Tutor?</h4>
                </div>
                <p className="text-xs text-white/80 leading-relaxed">
                  Join a live SOCRATES Study Room with interactive Whiteboard & Code IDE to solve complex problem sets with tutors in real-time.
                </p>
                <Link
                  to="/study-room/demo-101"
                  className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-white text-[#0066cc] text-xs font-extrabold hover:bg-white/90 transition-all shadow-md cursor-pointer"
                >
                  <span>Enter Live Study Room</span>
                  <ChevronRight size={14} />
                </Link>
              </div>

              {/* Quiz Stats Card */}
              <div className="bg-white rounded-3xl border border-[#e5e5e7] p-6 shadow-sm space-y-4">
                <h4 className="text-sm font-bold text-[#1d1d1f]">Session Accuracy</h4>
                <div className="space-y-3">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-[#6e6e73]">Correct Answers</span>
                    <span className="font-bold text-emerald-600">{userScore}</span>
                  </div>
                  <div className="w-full bg-[#f0f0f2] h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full transition-all duration-300"
                      style={{ width: `${currentQIndex > 0 ? (userScore / (currentQIndex + 1)) * 100 : 0}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-[#86868b]">
                    <span>Earned XP</span>
                    <span className="font-bold text-[#0066cc]">+{userScore * 50} XP</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: FLASHCARD HUB */}
        {activeTab === 'flashcards' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-[#1d1d1f]">Formula & Concept Flashcards</h3>
              <p className="text-xs text-[#6e6e73]">Click the card to flip and reveal the mathematical definition and formula.</p>
            </div>

            {/* Interactive Flip Card */}
            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className="w-full h-80 bg-white rounded-3xl border border-[#e5e5e7] shadow-xl p-8 flex flex-col justify-between cursor-pointer select-none transition-all duration-300 hover:border-[#0066cc]/40 relative overflow-hidden"
            >
              <div className="flex items-center justify-between text-xs text-[#86868b]">
                <span className="px-3 py-1 rounded-full bg-[#f0f0f2] font-semibold text-[#1d1d1f]">
                  {currentCard.subject}
                </span>
                <span>Click anywhere to flip 🔄</span>
              </div>

              <div className="flex flex-col items-center justify-center text-center space-y-4 my-auto">
                {!isFlipped ? (
                  <>
                    <h4 className="text-xl font-extrabold text-[#1d1d1f]">{currentCard.concept}</h4>
                    <p className="text-xs text-[#6e6e73] max-w-md">{currentCard.hint}</p>
                  </>
                ) : (
                  <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
                    <span className="text-xs font-bold uppercase tracking-widest text-[#0066cc]">Formula Definition</span>
                    <div className="p-4 rounded-2xl bg-[#f5f5f7] border border-[#e0e0e2] text-base md:text-lg font-mono font-bold text-[#1d1d1f]">
                      {currentCard.formula}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-[#86868b] border-t border-[#e5e5e7] pt-4">
                <span>Card {currentCardIndex + 1} of {FLASHCARDS.length}</span>
                <span className="font-semibold text-[#0066cc]">{isFlipped ? 'Answer Revealed' : 'Front View'}</span>
              </div>
            </div>

            {/* Flashcard Navigation */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  setIsFlipped(false)
                  setCurrentCardIndex((prev) => (prev > 0 ? prev - 1 : FLASHCARDS.length - 1))
                }}
                className="px-5 py-2.5 rounded-full bg-white border border-[#e0e0e2] text-xs font-semibold text-[#525252] hover:bg-[#f0f0f2] transition-colors cursor-pointer"
              >
                Previous Card
              </button>
              <button
                onClick={() => {
                  setIsFlipped(false)
                  setCurrentCardIndex((prev) => (prev + 1) % FLASHCARDS.length)
                }}
                className="px-6 py-2.5 rounded-full bg-[#0066cc] text-white text-xs font-semibold hover:bg-[#0077ed] transition-colors cursor-pointer shadow-md shadow-[#0066cc]/20"
              >
                Next Card
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: LEADERBOARD */}
        {activeTab === 'leaderboard' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white rounded-3xl border border-[#e5e5e7] p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-[#1d1d1f]">SOCRATES Daily Leaderboard</h3>
                  <p className="text-xs text-[#6e6e73]">Rankings updated in real-time based on AI practice quiz scores & daily streaks.</p>
                </div>
                <Trophy size={28} className="text-amber-500" />
              </div>

              <div className="divide-y divide-[#e5e5e7]">
                {LEADERBOARD.map((item) => (
                  <div key={item.rank} className="py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                        item.rank === 1
                          ? 'bg-amber-100 text-amber-700 border border-amber-300'
                          : item.rank === 2
                          ? 'bg-slate-100 text-slate-700 border border-slate-300'
                          : item.rank === 3
                          ? 'bg-amber-700/10 text-amber-800 border border-amber-700/20'
                          : 'bg-[#f0f0f2] text-[#6e6e73]'
                      }`}>
                        #{item.rank}
                      </span>
                      <div>
                        <h4 className="text-sm font-bold text-[#1d1d1f] flex items-center gap-2">
                          {item.name}
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#0066cc]/10 text-[#0066cc]">
                            {item.badge}
                          </span>
                        </h4>
                        <span className="text-xs text-[#86868b]">🔥 {item.streak} Day Streak</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-extrabold text-[#0066cc]">{item.xp.toLocaleString()} XP</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
