import React, { useState, useMemo, useRef, useEffect } from 'react'
import {
  FileText,
  Search,
  Download,
  Copy,
  Check,
  X,
  Mic,
  MicOff,
  Users,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  Send,
  HelpCircle,
} from 'lucide-react'
import type { TranscriptEntry } from '../../hooks/useSpeechTranscription'

interface LiveTranscriptDrawerProps {
  isOpen: boolean
  onClose: () => void
  entries: TranscriptEntry[]
  interimText?: string
  currentUserName: string
  isMicOn: boolean
  speechError?: string | null
  isSoundDetected?: boolean
  micVolume?: number
  onRestartSpeech?: () => void
  onAddManualTranscript?: (text: string) => void
}

export default function LiveTranscriptDrawer({
  isOpen,
  onClose,
  entries,
  interimText,
  currentUserName,
  isMicOn,
  speechError,
  isSoundDetected,
  micVolume = 0,
  onRestartSpeech,
  onAddManualTranscript,
}: LiveTranscriptDrawerProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [copied, setCopied] = useState(false)
  const [manualText, setManualText] = useState('')
  const [showHeadphoneHelp, setShowHeadphoneHelp] = useState(false)
  const listEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on new entries
  useEffect(() => {
    if (isOpen) {
      listEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [entries.length, interimText, isOpen])

  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return entries
    const q = searchQuery.toLowerCase()
    return entries.filter(
      (e) =>
        e.text.toLowerCase().includes(q) ||
        e.speakerName.toLowerCase().includes(q)
    )
  }, [entries, searchQuery])

  const totalWords = useMemo(() => {
    return entries.reduce(
      (acc, curr) => acc + curr.text.split(/\s+/).filter(Boolean).length,
      0
    )
  }, [entries])

  const handleCopyTranscript = () => {
    if (entries.length === 0) return
    const text = entries
      .map(
        (e) =>
          `[${e.timeFormatted}] ${e.speakerName} (${e.role.toUpperCase()}):\n${e.text}\n`
      )
      .join('\n')

    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadTranscript = () => {
    if (entries.length === 0) return
    const markdownContent = [
      `# Socrates Session Dialogue Transcript`,
      `**Generated:** ${new Date().toLocaleString()}`,
      `**Total Spoken Lines:** ${entries.length} | **Total Spoken Words:** ${totalWords}`,
      `\n---\n`,
      entries
        .map(
          (e) =>
            `**[${e.timeFormatted}] ${e.speakerName} (${e.role.toUpperCase()})**:\n> ${e.text}\n`
        )
        .join('\n'),
    ].join('\n')

    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `socrates_transcript_${Date.now()}.md`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleSendManual = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!manualText.trim()) return
    onAddManualTranscript?.(manualText.trim())
    setManualText('')
  }

  if (!isOpen) return null

  return (
    <div className="flex flex-col h-full bg-white select-none overflow-hidden font-sans">
      {/* Header */}
      <div className="p-3.5 border-b border-[#e5e5e7] flex items-center justify-between shrink-0 bg-white">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[#0066cc]/10 text-[#0066cc] flex items-center justify-center shrink-0">
            <FileText size={16} />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-bold text-[#1d1d1f] tracking-tight truncate">
              Session Transcript
            </h3>
            <p className="text-[10px] text-[#7a7a7a] font-medium truncate">
              {entries.length} dialogue{entries.length === 1 ? '' : 's'} • {totalWords} words
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={handleCopyTranscript}
            disabled={entries.length === 0}
            className="p-1.5 rounded-lg text-[#7a7a7a] hover:text-[#1d1d1f] hover:bg-[#f0f0f2] transition-colors cursor-pointer disabled:opacity-30"
            title="Copy full transcript"
          >
            {copied ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
          </button>
          <button
            type="button"
            onClick={handleDownloadTranscript}
            disabled={entries.length === 0}
            className="p-1.5 rounded-lg text-[#7a7a7a] hover:text-[#1d1d1f] hover:bg-[#f0f0f2] transition-colors cursor-pointer disabled:opacity-30"
            title="Download transcript (.md)"
          >
            <Download size={15} />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#7a7a7a] hover:text-[#1d1d1f] hover:bg-[#f0f0f2] transition-colors cursor-pointer ml-0.5"
            title="Close transcript & return to Chat"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Speech Recognition Error Banner (If Any) */}
      {speechError && (
        <div className="p-3 bg-amber-50 border-b border-amber-200/80 text-amber-900 text-xs shrink-0 flex items-start gap-2.5">
          <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1.5">
            <p className="font-semibold text-[11px] leading-tight text-amber-950">
              {speechError}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onRestartSpeech}
                className="px-2 py-1 rounded bg-amber-200/60 hover:bg-amber-200 text-[10px] font-bold text-amber-900 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw size={10} />
                <span>Retry Mic</span>
              </button>
              <button
                type="button"
                onClick={() => setShowHeadphoneHelp((v) => !v)}
                className="text-[10px] font-semibold text-amber-800 underline hover:text-amber-950 cursor-pointer"
              >
                {showHeadphoneHelp ? 'Hide guide' : 'Headphone setup guide'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Headphone Setup Guide Accordion */}
      {(showHeadphoneHelp || (!speechError && !isSoundDetected && isMicOn)) && (
        <div className="px-3 py-2 bg-blue-50/70 border-b border-blue-100 text-[11px] text-blue-900 shrink-0 space-y-1">
          <div className="flex items-center justify-between font-bold text-[10px] text-blue-950 uppercase tracking-wider">
            <span className="flex items-center gap-1">
              <HelpCircle size={12} className="text-blue-600" />
              Headphone Microphone Tip
            </span>
            <button
              type="button"
              onClick={() => setShowHeadphoneHelp(false)}
              className="text-blue-600 hover:text-blue-950 font-normal cursor-pointer"
            >
              Dismiss
            </button>
          </div>
          <p className="leading-relaxed text-blue-900/90 text-[10px]">
            In Windows, browsers strictly listen to the <strong>Default Input Device</strong>. If your headset mic is quiet, right-click the Speaker icon on your Windows taskbar → <strong>Sound Settings</strong> → set your <strong>Headphones/Headset</strong> as the <strong>Default Input Device</strong>.
          </p>
        </div>
      )}

      {/* Search Input Bar */}
      <div className="p-2.5 border-b border-[#e5e5e7] bg-[#f9f9fb] shrink-0">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a1a1a6]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search dialogue by member or keyword..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-[#e0e0e0] rounded-xl text-[#1d1d1f] placeholder:text-[#a1a1a6] focus:outline-hidden focus:border-[#0066cc] focus:ring-1 focus:ring-[#0066cc]/20 transition-all font-sans"
          />
        </div>
      </div>

      {/* Mic Status Bar */}
      <div className="px-3.5 py-2 bg-[#f5f5f7]/80 border-b border-[#e5e5e7] flex items-center justify-between text-[10px] shrink-0">
        <div className="flex items-center gap-2">
          {isMicOn ? (
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <Mic size={11} className="text-emerald-600" />
              <span className="text-emerald-700 font-semibold">
                Mic Active • Transcribing
              </span>
              {micVolume > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-mono font-bold">
                  {micVolume}% vol
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[#7a7a7a]">
              <MicOff size={11} className="text-red-400" />
              <span>Mic Muted (Unmute to transcribe)</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 text-[#7a7a7a]">
          <Sparkles size={10} className="text-amber-500" />
          <span>AI Ledger</span>
        </div>
      </div>

      {/* Transcript Dialogue List */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-2.5 scrollbar-thin scrollbar-thumb-gray-200">
        {filteredEntries.length === 0 && !interimText ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3 text-[#7a7a7a]">
            <div className="w-12 h-12 rounded-2xl bg-[#f5f5f7] border border-[#e5e5e7] flex items-center justify-center text-[#a1a1a6]">
              <Users size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#1d1d1f]">
                {searchQuery ? 'No dialogue matches your search' : 'No spoken words recorded yet'}
              </p>
              <p className="text-[11px] text-[#7a7a7a] mt-1 max-w-[240px] leading-relaxed">
                {searchQuery
                  ? 'Try a different search term or clear the filter.'
                  : 'Start speaking into your headphone or mic. Each phrase will appear here in real time.'}
              </p>
            </div>
          </div>
        ) : (
          filteredEntries.map((entry, idx) => {
            const isTutor = entry.role === 'tutor'
            const isSelf = entry.speakerName === currentUserName

            return (
              <div
                key={entry._id || `${entry.timestamp}-${idx}`}
                className={`p-3 rounded-2xl border transition-all space-y-1.5 select-text min-w-0 max-w-full overflow-hidden ${
                  isTutor
                    ? 'bg-emerald-50/50 border-emerald-200/70 hover:border-emerald-300'
                    : 'bg-[#f8f8fa] border-[#e8e8ed] hover:border-[#dcdce0]'
                }`}
              >
                <div className="flex items-center justify-between min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0 truncate">
                    <span
                      className={`text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-md border shrink-0 ${
                        isTutor
                          ? 'bg-emerald-100/80 text-emerald-800 border-emerald-300/80'
                          : 'bg-blue-100/80 text-blue-800 border-blue-200'
                      }`}
                    >
                      {isTutor ? 'Tutor' : 'Student'}
                    </span>
                    <span className="text-xs font-bold text-[#1d1d1f] truncate">
                      {entry.speakerName} {isSelf && <span className="text-[#7a7a7a] font-normal">(You)</span>}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#7a7a7a] font-mono tabular-nums shrink-0 ml-2">
                    {entry.timeFormatted}
                  </span>
                </div>
                <p className="text-xs text-[#2c2c2e] leading-relaxed font-sans font-normal break-words [overflow-wrap:anywhere] whitespace-pre-wrap">
                  {entry.text}
                </p>
              </div>
            )
          })
        )}

        {/* Interim In-Flight Speech (While currently talking) */}
        {interimText && (
          <div className="p-3 rounded-2xl bg-blue-50/80 border border-blue-200/80 space-y-1.5 animate-pulse min-w-0 max-w-full overflow-hidden">
            <div className="flex items-center justify-between min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-800 border border-blue-200 shrink-0">
                  Speaking...
                </span>
                <span className="text-xs font-bold text-[#1d1d1f] truncate">
                  {currentUserName}
                </span>
              </div>
              <span className="text-[10px] text-blue-600 font-mono font-bold animate-pulse shrink-0 ml-2">
                Live
              </span>
            </div>
            <p className="text-xs text-blue-950/90 leading-relaxed italic font-sans break-words [overflow-wrap:anywhere] whitespace-pre-wrap">
              "{interimText}..."
            </p>
          </div>
        )}

        <div ref={listEndRef} />
      </div>

      {/* Manual Spoken Note / Fallback Entry */}
      {onAddManualTranscript && (
        <form onSubmit={handleSendManual} className="p-2.5 border-t border-[#e5e5e7] bg-white shrink-0">
          <div className="flex items-center gap-1.5 bg-[#f5f5f7] rounded-xl border border-[#e0e0e0] p-1.5 focus-within:border-[#0066cc] focus-within:ring-1 focus-within:ring-[#0066cc]/20 transition-all">
            <input
              type="text"
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              placeholder="Or type a spoken line or note..."
              className="flex-1 text-xs bg-transparent outline-none text-[#1d1d1f] placeholder:text-[#a1a1a6] px-1.5 font-sans"
            />
            <button
              type="submit"
              disabled={!manualText.trim()}
              className="p-1.5 rounded-lg bg-[#0066cc] text-white hover:bg-[#0077ed] transition-all cursor-pointer disabled:opacity-30"
              title="Add to transcript"
            >
              <Send size={13} />
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
