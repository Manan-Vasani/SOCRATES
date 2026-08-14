import type { UserProfile } from '../store/useAuthStore'

export const BASE_SUBJECT_DOMAINS: string[] = [
  'Algorithms',
  'Data Structures',
  'Linear Algebra',
  'Machine Learning',
  'PyTorch',
  'Python',
  'React',
  'TypeScript',
  'Node.js',
  'Quantum Physics',
  'Statistics',
  'Organic Chemistry',
  'Calculus',
  'C++',
  'Database Systems',
  'Computer Networks',
  'Web Development',
  'Artificial Intelligence',
  'Cyber Security',
  'Mathematics',
  'Computer Science',
  'Physics',
  'Chemistry',
  'Engineering',
]

/**
 * Strict validator to filter out garbage test strings like "fff", "ffff", "fff, ffff", "hh", "aaa"
 */
export function isValidSubjectName(subject: string): boolean {
  if (!subject || typeof subject !== 'string') return false
  const trimmed = subject.trim()

  // Allowed short single-letter or symbol subjects
  if (['R', 'C', 'C++'].includes(trimmed)) return true

  // 1. Min length 3
  if (trimmed.length < 3) return false

  // 2. Filter out single repeated characters (e.g. "fff", "ffff", "hh", "aaa")
  if (/^([a-zA-Z])\1+$/i.test(trimmed)) return false

  // 3. Filter out comma or space separated repeated character words (e.g. "fff, ffff")
  const words = trimmed.split(/[\s,]+/).filter(Boolean)
  if (words.length > 0 && words.every((w) => /^([a-zA-Z])\1+$/i.test(w))) return false

  // 4. Must contain at least one vowel, digit, or standard symbol
  const hasVowelOrNum = /[aeiouyAEIOUY0-9+#]/.test(trimmed)
  if (!hasVowelOrNum && trimmed.length < 5) return false

  return true
}

/**
 * Returns a clean, deduplicated, sanitized list of all global subjects across Tutors & Core Subject Domains.
 * Student personal profile subjects remain private to each student's profile.
 */
export function getUnifiedSubjectList(
  tutorsList: Array<{ subjects?: string[]; subject?: string }> = [],
  _user?: UserProfile | null,
  includeAllOption = false
): string[] {
  const set = new Set<string>()

  if (includeAllOption) {
    set.add('All')
  }

  // 1. Core Base Subject Domains
  BASE_SUBJECT_DOMAINS.forEach((s) => set.add(s.trim()))

  // 2. All Subjects from Tutors across the platform (Strictly sanitized)
  tutorsList.forEach((t) => {
    if (t.subjects && Array.isArray(t.subjects)) {
      t.subjects.forEach((s) => {
        if (s && typeof s === 'string' && isValidSubjectName(s)) {
          set.add(s.trim())
        }
      })
    }
    if (t.subject && typeof t.subject === 'string') {
      const rawSubject = t.subject.trim()
      if (isValidSubjectName(rawSubject)) {
        set.add(rawSubject)
      }

      rawSubject.split(/[,&]/).forEach((s) => {
        const trimmed = s.trim()
        if (isValidSubjectName(trimmed)) {
          set.add(trimmed)
        }
      })
    }
  })

  const result = Array.from(set).filter((s) => s === 'All' || isValidSubjectName(s))

  if (includeAllOption) {
    const withoutAll = result.filter((s) => s !== 'All')
    return ['All', ...withoutAll]
  }
  return result
}
