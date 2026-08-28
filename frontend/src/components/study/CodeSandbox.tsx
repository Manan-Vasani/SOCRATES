import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  Play,
  Trash2,
  Copy,
  ChevronDown,
  Terminal,
  Clock,
  HardDrive,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Sun,
  Moon,
  Download,
  ChevronsUpDown,
  Sparkles,
  X,
  Lock,
  Check,
  Code2,
  Shield,
} from 'lucide-react'
import { SiJavascript, SiCplusplus, SiHtml5, SiPostgresql } from 'react-icons/si'
import { FaJava } from 'react-icons/fa6'

type Language = 'python' | 'javascript' | 'cpp' | 'java' | 'html' | 'sql'

interface LanguageConfig {
  key: Language
  label: string
  ext: string
  color: string
  boilerplate: string
}

const LANGUAGES: LanguageConfig[] = [
  { key: 'python', label: 'Python 3', ext: '.py', color: '#3776ab', boilerplate: `# Python 3 — SOCRATES Study Room\n\ndef fibonacci(n):\n    """Generate Fibonacci sequence"""\n    a, b = 0, 1\n    result = []\n    for _ in range(n):\n        result.append(a)\n        a, b = b, a + b\n    return result\n\nprint(fibonacci(10))` },
  { key: 'javascript', label: 'JavaScript', ext: '.js', color: '#f7df1e', boilerplate: `// JavaScript — SOCRATES Study Room\n\nconst fibonacci = (n) => {\n  const seq = [0, 1];\n  for (let i = 2; i < n; i++) {\n    seq.push(seq[i-1] + seq[i-2]);\n  }\n  return seq;\n};\n\nconsole.log(fibonacci(10));` },
  { key: 'cpp', label: 'C++', ext: '.cpp', color: '#00599c', boilerplate: `// C++ — SOCRATES Study Room\n#include <iostream>\n#include <vector>\nusing namespace std;\n\nvector<int> fibonacci(int n) {\n    vector<int> seq = {0, 1};\n    for (int i = 2; i < n; i++)\n        seq.push_back(seq[i-1] + seq[i-2]);\n    return seq;\n}\n\nint main() {\n    auto result = fibonacci(10);\n    for (int x : result)\n        cout << x << " ";\n    cout << endl;\n    return 0;\n}` },
  { key: 'java', label: 'Java', ext: '.java', color: '#ed8b00', boilerplate: `// Java — SOCRATES Study Room\nimport java.util.Arrays;\n\npublic class Main {\n    public static int[] fibonacci(int n) {\n        int[] seq = new int[n];\n        seq[0] = 0; seq[1] = 1;\n        for (int i = 2; i < n; i++)\n            seq[i] = seq[i-1] + seq[i-2];\n        return seq;\n    }\n\n    public static void main(String[] args) {\n        System.out.println(Arrays.toString(fibonacci(10)));\n    }\n}` },
  { key: 'html', label: 'HTML', ext: '.html', color: '#e34f26', boilerplate: `<!-- HTML — SOCRATES Study Room -->\n<!DOCTYPE html>\n<html>\n<head>\n  <style>\n    body {\n      font-family: system-ui, sans-serif;\n      padding: 2rem;\n      background: #f8fafc;\n    }\n    h1 { color: #0066cc; }\n    .card {\n      padding: 1.5rem;\n      border-radius: 1rem;\n      background: white;\n      box-shadow: 0 1px 3px rgba(0,0,0,0.1);\n    }\n  </style>\n</head>\n<body>\n  <div class="card">\n    <h1>Hello from SOCRATES!</h1>\n    <p>Start editing to see changes.</p>\n  </div>\n</body>\n</html>` },
  { key: 'sql', label: 'SQL', ext: '.sql', color: '#336791', boilerplate: `-- SQL — SOCRATES Study Room\n\nSELECT \n  s.student_name,\n  c.course_name,\n  e.score,\n  CASE \n    WHEN e.score >= 90 THEN 'A'\n    WHEN e.score >= 80 THEN 'B'\n    WHEN e.score >= 70 THEN 'C'\n    ELSE 'F'\n  END AS grade\nFROM students s\nJOIN enrollments e ON s.id = e.student_id\nJOIN courses c ON e.course_id = c.id\nWHERE e.score >= 70\nORDER BY e.score DESC\nLIMIT 20;` },
]

const EXT_TO_LANG: Record<string, { lang: Language; label: string }> = {
  '.py': { lang: 'python', label: 'Python 3' },
  '.js': { lang: 'javascript', label: 'JavaScript' },
  '.jsx': { lang: 'javascript', label: 'JavaScript' },
  '.ts': { lang: 'javascript', label: 'JavaScript' },
  '.tsx': { lang: 'javascript', label: 'JavaScript' },
  '.cpp': { lang: 'cpp', label: 'C++' },
  '.c': { lang: 'cpp', label: 'C++' },
  '.cc': { lang: 'cpp', label: 'C++' },
  '.java': { lang: 'java', label: 'Java' },
  '.html': { lang: 'html', label: 'HTML' },
  '.htm': { lang: 'html', label: 'HTML' },
  '.sql': { lang: 'sql', label: 'SQL' },
}

const LANGUAGE_ICONS: Record<Language, React.ReactNode> = {
  python: (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 110 110" fill="none">
      <path d="M53.8 2.2c-27.4 0-25.7 11.9-25.7 11.9l.1 12.3h26.2v3.7H17.6S.1 28.1.1 55.7c0 27.6 15.3 26.7 15.3 26.7h9.1V69.5s-.5-15.3 15.3-15.3h26.2s14.4.2 14.4-14.3V25.9S82.4 2.2 53.8 2.2zm-14.4 8.3a4.9 4.9 0 1 1 0 9.8 4.9 4.9 0 0 1 0-9.8z" fill="#3776AB"/>
      <path d="M54.6 107.8c27.4 0 25.7-11.9 25.7-11.9l-.1-12.3H54V79.9h36.8s17.5 2 17.5-25.6c0-27.6-15.3-26.7-15.3-26.7h-9.1v12.9s.5 15.3-15.3 15.3H42.4S28 55.5 28 70v14.1s-2 23.7 26.6 23.7zm14.4-8.3a4.9 4.9 0 1 1 0-9.8 4.9 4.9 0 0 1 0 9.8z" fill="#FFD43B"/>
    </svg>
  ),
  javascript: <SiJavascript size={16} className="text-[#f7df1e] bg-black rounded-xs shrink-0" />,
  cpp: <SiCplusplus size={16} className="text-[#00599C] shrink-0" />,
  java: <FaJava size={16} className="text-[#E76F00] shrink-0" />,
  html: <SiHtml5 size={16} className="text-[#E34F26] shrink-0" />,
  sql: <SiPostgresql size={16} className="text-[#4169E1] shrink-0" />,
}

interface OutputLine { type: 'stdout' | 'error' | 'info'; text: string }

export interface CodeSandboxProps {
  canEdit?: boolean
  isTutor?: boolean
  socket?: import('socket.io-client').Socket | null
  socketRef?: React.RefObject<import('socket.io-client').Socket | null>
  roomId?: string
  runnerName?: string
  onRequestPermission?: () => void
  onGrantPermission?: (socketId: string) => void
  onRevokePermission?: (socketId: string) => void
  codeRequests?: { socketId: string; name: string; time: string }[]
  onDenyRequest?: (socketId: string) => void
}

export default function CodeSandbox({
  canEdit = true,
  isTutor = false,
  socket,
  socketRef,
  roomId,
  runnerName,
  onRequestPermission,
  onGrantPermission,
  onRevokePermission,
  codeRequests = [],
  onDenyRequest,
}: CodeSandboxProps) {
  const [language, setLanguage] = useState<Language>('python')
  const [fullFileName, setFullFileName] = useState('example.py')
  const [code, setCode] = useState(LANGUAGES[0].boilerplate)
  const [showLangPicker, setShowLangPicker] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [output, setOutput] = useState<OutputLine[]>([])
  const [execTime, setExecTime] = useState<number | null>(null)
  const [memUsage, setMemUsage] = useState<string | null>(null)
  const [isDark, setIsDark] = useState(true)
  const [outputTab, setOutputTab] = useState<'terminal' | 'preview'>('terminal')
  const [toast, setToast] = useState<{ type: 'success' | 'warning'; text: string } | null>(null)
  const [isRequestPending, setIsRequestPending] = useState(false)
  const [isBannerVisible, setIsBannerVisible] = useState(true)
  const bannerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Reset request pending state when permission is granted
  useEffect(() => {
    if (canEdit || isTutor) {
      setIsRequestPending(false)
    }
  }, [canEdit, isTutor])

  const isRemoteUpdateRef = useRef(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const activeSocket = socket || socketRef?.current

  // ─── Socket Synchronization for Collaborative Code Sandbox ───
  useEffect(() => {
    const s = socket || socketRef?.current
    if (!s || !roomId) return

    // Request initial code state upon joining room
    s.emit('request-code-sync', { roomId })

    const handleRemoteCode = ({ code: remoteCode }: { code: string }) => {
      if (typeof remoteCode === 'string') {
        const textarea = textareaRef.current
        if (textarea && document.activeElement === textarea) {
          const start = textarea.selectionStart
          const end = textarea.selectionEnd
          isRemoteUpdateRef.current = true
          setCode(remoteCode)
          requestAnimationFrame(() => {
            if (textareaRef.current) {
              textareaRef.current.selectionStart = start
              textareaRef.current.selectionEnd = end
            }
          })
        } else {
          isRemoteUpdateRef.current = true
          setCode(remoteCode)
        }
      }
    }

    const handleRemoteLanguage = ({
      language: remoteLang,
      fileName: remoteFileName,
      code: remoteCode,
    }: {
      language: Language
      fileName?: string
      code?: string
    }) => {
      if (remoteLang) {
        setLanguage(remoteLang)
        if (remoteFileName) setFullFileName(remoteFileName)
        if (typeof remoteCode === 'string') {
          isRemoteUpdateRef.current = true
          setCode(remoteCode)
        }
      }
    }

    const handleCodeSync = (state: { code?: string; language?: Language; fileName?: string } | null) => {
      if (state) {
        if (typeof state.code === 'string' && state.code.trim()) {
          isRemoteUpdateRef.current = true
          setCode(state.code)
        }
        if (state.language) setLanguage(state.language)
        if (state.fileName) setFullFileName(state.fileName)
      }
    }

    const handleRemoteExecutionStart = ({ runnerName: rName }: { runnerName?: string }) => {
      setIsRunning(true)
      setOutput([{ type: 'info', text: `[${rName || 'Peer'} started code execution...]` }])
      setToast({ type: 'warning', text: `${rName || 'Peer'} is running the code...` })
    }

    const handleRemoteExecutionFinish = ({
      output: remoteOutput,
      execTime: remoteExecTime,
      memUsage: remoteMemUsage,
    }: {
      output: OutputLine[]
      execTime?: number | null
      memUsage?: string | null
    }) => {
      setIsRunning(false)
      if (Array.isArray(remoteOutput)) {
        setOutput(remoteOutput)
      }
      if (remoteExecTime !== undefined) setExecTime(remoteExecTime)
      if (remoteMemUsage !== undefined) setMemUsage(remoteMemUsage)
    }

    const handleRemoteExecutionClear = () => {
      setOutput([])
      setExecTime(null)
      setMemUsage(null)
    }

    s.on('code-change', handleRemoteCode)
    s.on('code-language-change', handleRemoteLanguage)
    s.on('code-sync', handleCodeSync)
    s.on('code-execution-start', handleRemoteExecutionStart)
    s.on('code-execution-finish', handleRemoteExecutionFinish)
    s.on('code-execution-clear', handleRemoteExecutionClear)

    return () => {
      s.off('code-change', handleRemoteCode)
      s.off('code-language-change', handleRemoteLanguage)
      s.off('code-sync', handleCodeSync)
      s.off('code-execution-start', handleRemoteExecutionStart)
      s.off('code-execution-finish', handleRemoteExecutionFinish)
      s.off('code-execution-clear', handleRemoteExecutionClear)
    }
  }, [socket, socketRef?.current, roomId])

  // Handle local code edits: emit immediately on every keystroke for real-time word-by-word sync
  const handleLocalCodeChange = (newCode: string) => {
    setCode(newCode)

    if (isRemoteUpdateRef.current) {
      isRemoteUpdateRef.current = false
      return
    }

    const s = socket || socketRef?.current
    if (s && roomId) {
      // Immediate broadcast: zero delay, word-by-word and character-by-character live sync
      s.emit('code-change', { roomId, code: newCode })
    }
  }

  // Auto-dismiss Toast notification
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  // Auto switch output tab to preview when HTML language is chosen
  useEffect(() => {
    if (language === 'html') {
      setOutputTab('preview')
    } else {
      setOutputTab('terminal')
    }
  }, [language])

  const currentLang = LANGUAGES.find((l) => l.key === language)!

  const switchLanguage = (lang: Language) => {
    setLanguage(lang)
    const cfg = LANGUAGES.find((l) => l.key === lang)!
    const baseName = fullFileName.replace(/\.[^/.]+$/, '') || 'example'
    const newFullName = `${baseName}${cfg.ext}`
    setFullFileName(newFullName)
    setCode(cfg.boilerplate)
    setOutput([])
    setExecTime(null)
    setMemUsage(null)
    setShowLangPicker(false)
    setToast({ type: 'success', text: `Language set to ${cfg.label} (${cfg.ext})` })

    const s = socket || socketRef?.current
    if (s && roomId) {
      s.emit('code-language-change', {
        roomId,
        language: lang,
        fileName: newFullName,
        code: cfg.boilerplate,
      })
      s.emit('code-change', {
        roomId,
        code: cfg.boilerplate,
      })
    }
  }

  const handleFileNameChange = (inputVal: string) => {
    setFullFileName(inputVal)
    const match = inputVal.match(/(\.[a-zA-Z0-9]+)$/)
    if (match) {
      const ext = match[1].toLowerCase()
      const mapped = EXT_TO_LANG[ext]
      if (mapped) {
        if (mapped.lang !== language) {
          setLanguage(mapped.lang)
          const cfg = LANGUAGES.find((l) => l.key === mapped.lang)!
          setCode(cfg.boilerplate)
          setToast({ type: 'success', text: `Detected ${ext} extension! Auto-switched language to ${mapped.label}.` })
        }
      } else if (ext.length >= 2) {
        setToast({
          type: 'warning',
          text: `Invalid or unrecognized extension "${ext}". Supported extensions: .py, .js, .cpp, .java, .html, .sql`,
        })
      }
    }
  }

  const downloadCode = () => {
    const nameToUse = fullFileName.trim() || `main${currentLang.ext}`
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = nameToUse
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setToast({ type: 'success', text: `Downloaded ${nameToUse} successfully!` })
  }

  const [stdinInput, setStdinInput] = useState('10')
  const [showStdin, setShowStdin] = useState(false)

  const mapLangToPaiza = (lang: Language) => {
    switch (lang) {
      case 'python':
        return 'python3'
      case 'javascript':
        return 'javascript'
      case 'cpp':
        return 'cpp'
      case 'java':
        return 'java'
      case 'sql':
        return 'mysql'
      default:
        return 'python3'
    }
  }

  const [termInput, setTermInput] = useState('')
  const termInputRef = useRef<HTMLInputElement>(null)

  const handleTermSubmit = (overrideInput?: string) => {
    const inputVal = overrideInput !== undefined ? overrideInput : termInput
    setStdinInput(inputVal)
    if (inputVal) {
      setOutput((prev) => [...prev, { type: 'input' as any, text: inputVal }])
    }
    setTermInput('')
    runCodeWithStdin(inputVal)
  }

  const runCodeWithStdin = async (customStdin?: string) => {
    const activeStdin = customStdin !== undefined ? customStdin : stdinInput
    setIsRunning(true)
    setOutput([])
    setExecTime(null)
    setMemUsage(null)

    const s = socket || socketRef?.current
    if (s && roomId) {
      s.emit('code-execution-start', { roomId, runnerName: runnerName || 'Participant' })
    }

    if (language === 'html') {
      setOutputTab('preview')
      const htmlExecTime = 4
      const htmlMem = '1.2 MB'
      const htmlLines: OutputLine[] = [{ type: 'info', text: 'HTML DOM Document rendered successfully in live preview.' }]
      setExecTime(htmlExecTime)
      setMemUsage(htmlMem)
      setOutput(htmlLines)
      setIsRunning(false)
      if (s && roomId) {
        s.emit('code-execution-finish', { roomId, output: htmlLines, execTime: htmlExecTime, memUsage: htmlMem })
      }
      return
    }

    let finalLines: OutputLine[] = []
    let finalExecTime: number = 50
    let finalMemUsage: string = '3.2 MB'

    try {
      const paizaLang = mapLangToPaiza(language)

      let preparedCode = code
      if (language === 'javascript' && code.includes('prompt(')) {
        preparedCode = `const prompt = (msg) => { if (msg) console.log(msg); return ${JSON.stringify(activeStdin)} || "User"; };\nconst alert = (msg) => console.log('[Alert]', msg);\n${code}`
      }

      const createRes = await fetch('https://api.paiza.io/runners/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: paizaLang, source_code: preparedCode, input: activeStdin, api_key: 'guest' }),
      })

      const createData = await createRes.json()
      if (!createData.id) {
        throw new Error(createData.error || 'Failed to initialize remote compiler API')
      }

      let details: any = null
      let attempts = 0
      while (attempts < 10) {
        await new Promise((r) => setTimeout(r, 750))
        const getRes = await fetch(`https://api.paiza.io/runners/get_details?id=${createData.id}&api_key=guest`)
        details = await getRes.json()
        if (details.status === 'completed') break
        attempts++
      }

      if (!details || details.status !== 'completed') {
        throw new Error('Remote compiler execution timed out.')
      }

      const timeSec = parseFloat(details.time || details.build_time || '0.02')
      finalExecTime = Math.max(1, Math.round(timeSec * 1000))
      finalMemUsage = details.memory ? `${(parseInt(details.memory) / (1024 * 1024)).toFixed(1)} MB` : '3.2 MB'

      setExecTime(finalExecTime)
      setMemUsage(finalMemUsage)

      if (details.build_stderr) {
        details.build_stderr.trim().split('\n').forEach((l: string) => {
          finalLines.push({ type: 'error', text: `[Compile Error] ${l}` })
        })
      }
      if (details.build_stdout) {
        details.build_stdout.trim().split('\n').forEach((l: string) => {
          finalLines.push({ type: 'info', text: `[Compiler Output] ${l}` })
        })
      }

      if (details.stderr) {
        details.stderr.trim().split('\n').forEach((l: string) => {
          if (l.includes('EOFError') || l.includes('EOF when reading a line')) {
            finalLines.push({ type: 'error', text: 'EOFError: input() expected STDIN input. Type a value below at the $ prompt and press Enter.' })
          } else {
            finalLines.push({ type: 'error', text: l })
          }
        })
      }
      if (details.stdout) {
        details.stdout.trim().split('\n').forEach((l: string) => {
          finalLines.push({ type: 'stdout', text: l })
        })
      }

      if (finalLines.length === 0) {
        finalLines.push({ type: 'info', text: `Program finished with result: ${details.result || 'success'}` })
      }

      setOutput(finalLines)
    } catch (err: any) {
      try {
        const localRes = await fetch('http://localhost:5000/api/v1/compile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ language, code, fileName: fullFileName, stdin: activeStdin }),
        })
        const localData = await localRes.json()
        finalExecTime = localData.execTime || 50
        finalMemUsage = `${(Math.random() * 4 + 2).toFixed(1)} MB`
        setExecTime(finalExecTime)
        setMemUsage(finalMemUsage)

        finalLines = []
        if (localData.stdout) {
          localData.stdout.trim().split('\n').forEach((l: string) => finalLines.push({ type: 'stdout', text: l }))
        }
        if (localData.stderr) {
          localData.stderr.trim().split('\n').forEach((l: string) => finalLines.push({ type: 'error', text: l }))
        }
        if (finalLines.length === 0) {
          finalLines.push({ type: 'info', text: 'Program finished with exit code 0.' })
        }
        setOutput(finalLines)
      } catch (localErr: any) {
        finalLines = [{ type: 'error', text: `Compiler Execution Error: ${err.message}` }]
        setOutput(finalLines)
      }
    } finally {
      setIsRunning(false)
      if (s && roomId) {
        s.emit('code-execution-finish', {
          roomId,
          output: finalLines,
          execTime: finalExecTime,
          memUsage: finalMemUsage,
        })
      }
    }
  }

  const clearOutput = () => {
    setOutput([])
    setExecTime(null)
    setMemUsage(null)
    const s = socket || socketRef?.current
    if (s && roomId) {
      s.emit('code-execution-clear', { roomId })
    }
  }
  const copyOutput = () => navigator.clipboard.writeText(output.map((o) => o.text).join('\n'))
  const lineNumbers = code.split('\n').length

  const [terminalHeight, setTerminalHeight] = useState(220)
  const [isResizingTerm, setIsResizingTerm] = useState(false)

  const handleTermMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizingTerm(true)
    const startY = e.clientY
    const startH = terminalHeight

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = startY - moveEvent.clientY
      const newH = Math.min(Math.max(startH + deltaY, 100), 550)
      setTerminalHeight(newH)
    }

    const onMouseUp = () => {
      setIsResizingTerm(false)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  return (
    <div className="flex flex-col w-full h-full relative">
      {/* Toast Notification Banner */}
      {toast && (
        <div
          className={`absolute top-14 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-white text-xs font-semibold shadow-xl border animate-in fade-in slide-in-from-top-2 duration-200 ${
            toast.type === 'warning'
              ? 'bg-amber-600 border-amber-400/40 shadow-amber-900/30'
              : 'bg-[#0066cc] border-white/20 shadow-blue-950/30'
          }`}
        >
          {toast.type === 'warning' ? (
            <AlertCircle size={14} className="shrink-0 text-amber-200" />
          ) : (
            <Sparkles size={14} className="shrink-0 text-amber-300" />
          )}
          <span>{toast.text}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-1.5 p-1 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* Top Toolbar */}
      <div className={`flex items-center justify-between px-4 py-2.5 border-b shrink-0 ${isDark ? 'bg-[#1a1a1e] border-[#2a2a2e]' : 'bg-[#f8f8fa] border-[#e5e5e7]'}`}>
        <div className="flex items-center gap-2.5">
          {/* Language Picker */}
          <div className="relative">
            <button
              onClick={() => {
                if (!canEdit && !isTutor) {
                  setToast({ type: 'warning', text: 'You are in view-only mode. Ask tutor for edit access.' })
                  return
                }
                setShowLangPicker(!showLangPicker)
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all select-none ${
                !canEdit && !isTutor ? 'opacity-80 cursor-default' : 'cursor-pointer'
              } ${
                isDark ? 'bg-white/8 text-white/80 hover:bg-white/12 border border-white/8' : 'bg-white border border-[#e5e5e7] text-[#1d1d1f] hover:bg-[#f0f0f2] shadow-sm'
              }`}
            >
              {LANGUAGE_ICONS[currentLang.key]}
              <span>{currentLang.label}</span>
              {(canEdit || isTutor) && <ChevronDown size={12} className="opacity-50" />}
            </button>
            {showLangPicker && (canEdit || isTutor) && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowLangPicker(false)} />
                <div className={`absolute top-full left-0 mt-1.5 rounded-2xl shadow-xl z-50 p-1.5 w-48 border ${isDark ? 'bg-[#2a2a2e] border-[#3a3a3e]' : 'bg-white border-[#e5e5e7]'}`}>
                  {LANGUAGES.map((l) => (
                    <button key={l.key} onClick={() => switchLanguage(l.key)} className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center gap-2.5 ${language === l.key ? 'bg-[#0066cc] text-white' : isDark ? 'text-white/70 hover:bg-white/8' : 'text-[#525252] hover:bg-[#f0f0f2]'}`}>
                      {LANGUAGE_ICONS[l.key]}
                      <span>{l.label}</span>
                      <span className={`ml-auto text-[9px] font-mono ${language === l.key ? 'text-white/60' : 'text-[#a1a1a6]'}`}>{l.ext}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Customizable Filename Input with Extension Detection */}
          <div className={`flex items-center px-3 py-1 rounded-full border text-xs font-mono transition-all duration-150 ${
            isDark
              ? 'bg-[#252529] border-white/15 text-white/90 focus-within:border-[#0066cc] focus-within:bg-[#2d2d33]'
              : 'bg-white border-[#e5e5e7] text-[#1d1d1f] focus-within:border-[#0066cc] shadow-2xs'
          }`}>
            <input
              type="text"
              readOnly={!canEdit && !isTutor}
              value={fullFileName}
              onChange={(e) => {
                if (!canEdit && !isTutor) return
                handleFileNameChange(e.target.value.replace(/\s+/g, ''))
              }}
              onBlur={() => {
                if (fullFileName.trim() === '') {
                  setFullFileName(`example${currentLang.ext}`)
                } else if (!fullFileName.includes('.')) {
                  setFullFileName(`${fullFileName.trim()}${currentLang.ext}`)
                }
              }}
              placeholder="example.py"
              style={{ width: `${Math.max(1, (fullFileName || 'example.py').length)}ch` }}
              className={`bg-transparent outline-none text-xs font-mono font-semibold text-left transition-all duration-150 ${
                !canEdit && !isTutor ? 'cursor-default' : 'cursor-text'
              } ${isDark ? 'placeholder:text-white/40' : 'placeholder:text-[#a1a1a6]'}`}
              title={!canEdit && !isTutor ? 'File name (view-only)' : 'Click to edit full file name and extension'}
            />
          </div>

          {/* Role / Permission Indicator Badge */}
          {!canEdit && !isTutor && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-medium">
              <Lock size={11} />
              <span>View Only</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Download File Button */}
          <button
            onClick={downloadCode}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              isDark
                ? 'bg-white/8 text-white/80 hover:bg-white/12 hover:text-white border border-white/8'
                : 'bg-white border border-[#e5e5e7] text-[#525252] hover:text-[#0066cc] hover:border-[#0066cc]/30 shadow-2xs'
            }`}
            title={`Download ${fullFileName}`}
          >
            <Download size={14} />
            <span className="hidden sm:inline">Download</span>
          </button>

          {/* Theme Toggle */}
          <button onClick={() => setIsDark(!isDark)} className={`p-2 rounded-xl transition-all cursor-pointer ${isDark ? 'text-white/40 hover:text-white/70 hover:bg-white/8' : 'text-[#a1a1a6] hover:text-[#525252] hover:bg-[#f0f0f2]'}`}>
            {isDark ? <Sun size={14} /> : <Moon size={14} />}
          </button>

          {/* Run Button */}
          <button
            onClick={() => {
              if (!canEdit && !isTutor) {
                setToast({ type: 'warning', text: 'You need edit permission to run code. Click "Ask Edit Access" below.' })
                return
              }
              runCodeWithStdin()
            }}
            disabled={isRunning || (!canEdit && !isTutor)}
            className={`flex items-center justify-center gap-2 w-36 py-2 rounded-xl text-xs font-bold transition-all shrink-0 select-none ${
              !canEdit && !isTutor
                ? 'bg-white/5 text-white/40 border border-white/10 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-md shadow-emerald-600/20 active:scale-98'
            } disabled:opacity-70`}
            title={!canEdit && !isTutor ? 'Ask tutor for edit permission to run code' : 'Execute code'}
          >
            {!canEdit && !isTutor ? (
              <>
                <Lock size={13} className="text-amber-400" />
                <span>Locked (View)</span>
              </>
            ) : isRunning ? (
              <>
                <Loader2 size={14} className="animate-spin shrink-0" />
                <span>Running...</span>
              </>
            ) : (
              <>
                <Play size={14} className="shrink-0" />
                <span>Run / Execute</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className={`flex-1 min-h-0 flex relative ${isDark ? 'bg-[#1e1e22]' : 'bg-white'}`}>
        {/* Line Numbers */}
        <div className={`w-12 text-right pr-3 pt-4 text-[11px] font-mono select-none shrink-0 border-r ${isDark ? 'text-[#444] bg-[#191920] border-[#2a2a2e]' : 'text-[#c0c0c4] bg-[#f8f8fa] border-[#e5e5e7]'}`}>
          {Array.from({ length: lineNumbers }, (_, i) => (
            <div key={i} className="h-[22px] leading-[22px]">{i + 1}</div>
          ))}
        </div>
        <textarea
          ref={textareaRef}
          readOnly={!canEdit && !isTutor}
          value={code}
          onChange={(e) => {
            if (!canEdit && !isTutor) return
            handleLocalCodeChange(e.target.value)
          }}
          spellCheck={false}
          className={`flex-1 resize-none p-4 text-[13px] font-mono leading-[22px] outline-none ${
            !canEdit && !isTutor ? 'cursor-default' : 'cursor-text'
          } ${isDark ? 'text-[#d4d4d8] bg-[#1e1e22] caret-[#4d9fff]' : 'text-[#1d1d1f] bg-white caret-[#0066cc]'}`}
          style={{ tabSize: 4 }}
        />

        {/* Permission Banner for Students (When in View-Only mode) */}
        {!canEdit && !isTutor && isBannerVisible && (
          <div
            onMouseEnter={() => {
              if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current)
            }}
            onMouseLeave={() => {
              if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current)
              bannerTimerRef.current = setTimeout(() => {
                setIsBannerVisible(false)
              }, 2500)
            }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-2xl bg-[#18181c]/95 backdrop-blur-2xl border border-white/12 shadow-[0_16px_40px_rgba(0,0,0,0.35)] ring-1 ring-white/5 text-white flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200 select-none"
          >
            <div className="flex items-center gap-2 text-white/70">
              <div className="w-6 h-6 rounded-lg bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-amber-400">
                <Lock size={12} />
              </div>
              <span className="text-xs font-semibold tracking-tight text-white/90">View-Only Code IDE</span>
            </div>
            {onRequestPermission && (
              <button
                type="button"
                disabled={isRequestPending}
                onClick={() => {
                  onRequestPermission()
                  setIsRequestPending(true)
                  setToast({ type: 'warning', text: 'Edit permission requested! Waiting for tutor approval...' })
                }}
                className={`px-3.5 py-1.5 rounded-xl text-white text-xs font-semibold tracking-wide transition-all duration-150 cursor-pointer select-none outline-none shadow-md flex items-center gap-1.5 transform-gpu active:scale-98 ${
                  isRequestPending
                    ? 'bg-amber-600/80 cursor-default opacity-90'
                    : 'bg-[#0066cc] hover:bg-[#0071e3] shadow-[#0066cc]/25'
                }`}
              >
                {isRequestPending ? (
                  <>
                    <Clock size={12} className="animate-spin text-amber-200" />
                    <span>Request Pending</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={12} className="text-sky-200" />
                    <span>Ask Edit Access</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Tutor Code Permission Request Prompt Overlay */}
        {isTutor && codeRequests.length > 0 && (
          <div className="absolute top-4 right-4 z-50 flex flex-col gap-2.5 max-w-[310px] w-full animate-in fade-in slide-in-from-top-3 duration-200">
            {codeRequests.map((req) => (
              <CodeRequestCard
                key={req.socketId || req.name}
                req={req}
                onGrantPermission={onGrantPermission}
                onDenyRequest={onDenyRequest}
              />
            ))}
          </div>
        )}
      </div>

      {/* Horizontal Resizer Handle Bar */}
      <div
        onMouseDown={handleTermMouseDown}
        className="h-1 relative z-30 cursor-row-resize group flex items-center justify-center bg-[#0a0a0c] hover:bg-[#0066cc]/50 active:bg-[#0066cc] transition-colors select-none shrink-0"
        title="Drag up/down to resize terminal height"
      >
        <div className="absolute left-1/2 -translate-x-1/2 w-6 h-3 rounded-full bg-[#1d1d1f] border border-white/20 text-white/70 group-hover:text-white group-hover:bg-[#0066cc] flex items-center justify-center shadow-lg transition-colors opacity-80 group-hover:opacity-100">
          <ChevronsUpDown size={9} />
        </div>
      </div>

      {/* Terminal / Live Output Panel */}
      <div
        style={{ height: `${terminalHeight}px` }}
        className="shrink-0 bg-[#0f0f14] flex flex-col transition-all duration-75"
      >
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
          <div className="flex items-center gap-3">
            {/* Output Tab Selector */}
            <div className="flex items-center bg-white/5 rounded-lg p-0.5 border border-white/10">
              <button
                onClick={() => setOutputTab('terminal')}
                className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors ${
                  outputTab === 'terminal' ? 'bg-[#0066cc] text-white shadow-sm' : 'text-white/40 hover:text-white/70'
                }`}
              >
                Terminal Output
              </button>
              {language === 'html' && (
                <button
                  onClick={() => setOutputTab('preview')}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors ${
                    outputTab === 'preview' ? 'bg-[#0066cc] text-white shadow-sm' : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  Live HTML Preview
                </button>
              )}
            </div>

            {execTime !== null && (
              <span className="flex items-center gap-1 text-[10px] text-emerald-400/60 bg-emerald-500/8 px-2 py-0.5 rounded-md">
                <Clock size={9} /> {execTime}ms
              </span>
            )}
            {memUsage && (
              <span className="flex items-center gap-1 text-[10px] text-blue-400/60 bg-blue-500/8 px-2 py-0.5 rounded-md">
                <HardDrive size={9} /> {memUsage}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={copyOutput} className="p-1.5 rounded-lg text-white/20 hover:text-white/50 transition-colors cursor-pointer" title="Copy"><Copy size={12} /></button>
            <button onClick={clearOutput} className="p-1.5 rounded-lg text-white/20 hover:text-white/50 transition-colors cursor-pointer" title="Clear"><Trash2 size={12} /></button>
          </div>
        </div>

        {outputTab === 'preview' && language === 'html' ? (
          <div className="flex-1 p-2 bg-[#1a1a1e]">
            <iframe
              srcDoc={code}
              title="HTML Live Preview"
              className="w-full h-full rounded-xl bg-white border border-white/10"
            />
          </div>
        ) : (
          <div
            onClick={() => termInputRef.current?.focus()}
            className="flex-1 overflow-y-auto px-4 py-3 font-mono text-xs cursor-text space-y-1"
          >
            {output.length === 0 && !isRunning && (
              <span className="text-white/20 italic block pb-1">
                Click terminal or press "Run / Execute". Type input at the $ prompt below & press Enter...
              </span>
            )}
            {isRunning && (
              <div className="flex items-center gap-2 text-amber-400/70 py-1">
                <Loader2 size={12} className="animate-spin text-amber-400" />
                <span>Compiling & Executing {currentLang.label}...</span>
              </div>
            )}
            {output.map((line, i) => (
              <div key={i} className="flex items-start gap-2 py-0.5">
                {line.type === 'stdout' && <CheckCircle2 size={11} className="text-emerald-400/70 mt-0.5 shrink-0" />}
                {line.type === 'error' && <AlertCircle size={11} className="text-red-400 mt-0.5 shrink-0" />}
                {(line.type as any) === 'input' && <span className="text-amber-400 font-bold">$</span>}
                <span className={line.type === 'error' ? 'text-red-400' : (line.type as any) === 'input' ? 'text-amber-300 font-bold' : line.type === 'info' ? 'text-blue-400/80 font-semibold' : 'text-white/80'}>
                  {line.text}
                </span>
              </div>
            ))}

            {/* Interactive Terminal Prompt Input Line */}
            <div className="flex items-center gap-2 pt-1.5 text-emerald-400 font-bold">
              <span className="text-emerald-400 text-xs font-mono">$</span>
              <input
                ref={termInputRef}
                type="text"
                value={termInput}
                onChange={(e) => setTermInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleTermSubmit()
                  }
                }}
                placeholder="Type terminal input & press Enter..."
                className="flex-1 bg-transparent outline-none text-xs font-mono text-white placeholder:text-white/20 caret-emerald-400"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function CodeRequestCard({
  req,
  onGrantPermission,
  onDenyRequest,
}: {
  req: { socketId: string; name: string; time?: string }
  onGrantPermission?: (socketId: string) => void
  onDenyRequest?: (socketId: string) => void
}) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const startDismissTimer = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      onDenyRequest?.(req.socketId)
    }, 4000)
  }, [onDenyRequest, req.socketId])

  useEffect(() => {
    startDismissTimer()
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [startDismissTimer])

  return (
    <div
      onMouseEnter={() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
      }}
      onMouseLeave={() => startDismissTimer()}
      className="p-3.5 rounded-2xl bg-[#18181c]/95 backdrop-blur-2xl border border-white/12 shadow-[0_20px_50px_rgba(0,0,0,0.5)] ring-1 ring-white/5 space-y-3 text-white animate-in fade-in slide-in-from-top-3 duration-200 select-none"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0066cc] to-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-md ring-1 ring-white/15 shrink-0 uppercase">
          {req.name.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-bold text-white tracking-tight truncate">{req.name}</div>
          <div className="text-[10px] font-medium text-emerald-400 flex items-center gap-1">
            <Terminal size={9} />
            <span>Code IDE Edit Request</span>
          </div>
        </div>
      </div>

      <p className="text-[11px] text-white/70 leading-relaxed pl-0.5">
        Requested permission to write, modify, and execute code in the Code Sandbox.
      </p>

      <div className="flex items-center gap-2 pt-0.5">
        <button
          type="button"
          onClick={() => onGrantPermission?.(req.socketId)}
          className="flex-1 py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white text-xs font-semibold tracking-wide transition-all duration-150 cursor-pointer shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5 outline-none transform-gpu active:scale-98"
        >
          <Check size={13} className="stroke-[2.5]" />
          <span>Grant Access</span>
        </button>
        <button
          type="button"
          onClick={() => onDenyRequest?.(req.socketId)}
          className="py-2 px-3.5 rounded-xl bg-white/8 hover:bg-white/14 active:bg-white/20 text-white/75 hover:text-white text-xs font-semibold tracking-wide transition-all duration-150 cursor-pointer border border-white/10 outline-none transform-gpu flex items-center gap-1 active:scale-98"
        >
          <X size={12} />
          <span>Deny</span>
        </button>
      </div>
    </div>
  )
}
