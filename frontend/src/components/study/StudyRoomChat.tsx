import React, { useState, useRef, useEffect } from 'react'
import {
  Send,
  Users,
  FolderOpen,
  MessageCircle,
  SmilePlus,
  Hand,
  MicOff,
  Image as ImageIcon,
  FileText,
  Sparkles,
  Bot,
  Calculator,
  Bug,
  Upload,
  Eye,
  Download,
  X,
  Paperclip,
} from 'lucide-react'

type ChatTab = 'chat' | 'ai' | 'participants' | 'resources'

interface ChatMessage {
  id: string
  sender: string
  role: 'tutor' | 'student' | 'system'
  text: string
  time: string
}

interface AIMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
}

interface Participant {
  id: string
  name: string
  role: 'tutor' | 'student'
  avatar?: string
  isHandRaised: boolean
  isMuted: boolean
}

interface SharedResource {
  id: string
  name: string
  type: 'pdf' | 'image' | 'canvas'
  uploadedBy: string
  time: string
  size: string
  url?: string
}

interface StudyRoomChatProps {
  participants: Participant[]
  activeTab?: ChatTab
  onTabChange?: (tab: ChatTab) => void
}

const QUICK_REACTIONS = ['👍', '👏', '💡', '❓', '🔥', '❤️']

const QUICK_ACTIONS = [
  { icon: <Calculator size={12} />, label: 'Explain Formula', prompt: 'Can you explain the mathematical formula on the whiteboard step by step?' },
  { icon: <Bug size={12} />, label: 'Debug Code', prompt: 'Can you review the code in the editor and highlight any logic errors?' },
  { icon: <FileText size={12} />, label: 'Summarize Session', prompt: 'Summarize the main takeaways from our study session so far.' },
]

export default function StudyRoomChat({ participants, activeTab = 'chat', onTabChange }: StudyRoomChatProps) {
  const [internalTab, setInternalTab] = useState<ChatTab>(activeTab)
  const tab = onTabChange ? activeTab : internalTab
  const setTab = (t: ChatTab) => {
    setInternalTab(t)
    onTabChange?.(t)
  }

  const [message, setMessage] = useState('')
  const [aiInput, setAiInput] = useState('')
  const [isAIThinking, setIsAIThinking] = useState(false)
  const [showReactions, setShowReactions] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const aiEndRef = useRef<HTMLDivElement>(null)

  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', sender: 'System', role: 'system', text: 'Study session started. Welcome to the room!', time: 'Now' },
    { id: '2', sender: 'Dr. Alex Vance', role: 'tutor', text: "Welcome everyone! Let's dive into today's topic on derivatives and integrals. Feel free to use the whiteboard.", time: '1m ago' },
    { id: '3', sender: 'You', role: 'student', text: "Thanks! I have a question about the chain rule — can we start there?", time: 'Just now' },
  ])

  const [aiMessages, setAiMessages] = useState<AIMessage[]>([
    {
      id: '0',
      role: 'assistant',
      text: "Hey! I'm **Socrates AI** 🤖 — your study copilot. Ask me anything about your session, or use the quick actions below!",
    },
  ])

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [previewFile, setPreviewFile] = useState<SharedResource | null>(null)
  const [resources, setResources] = useState<SharedResource[]>([
    { id: '1', name: 'Calculus_Chapter_4.pdf', type: 'pdf', uploadedBy: 'Dr. Alex Vance', time: '5m ago', size: '2.4 MB' },
    { id: '2', name: 'whiteboard_export.png', type: 'image', uploadedBy: 'You', time: '2m ago', size: '340 KB' },
    { id: '3', name: 'Practice_Problems.pdf', type: 'pdf', uploadedBy: 'Dr. Alex Vance', time: '1m ago', size: '1.1 MB' },
  ])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const isPdf = file.name.toLowerCase().endsWith('.pdf')
    const fileUrl = URL.createObjectURL(file)
    const newResource: SharedResource = {
      id: String(Date.now()),
      name: file.name,
      type: isPdf ? 'pdf' : 'image',
      uploadedBy: 'You',
      time: 'Just now',
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      url: fileUrl,
    }
    setResources((prev) => [newResource, ...prev])

    // Announce file share in chat
    setMessages((prev) => [
      ...prev,
      {
        id: String(Date.now() + 1),
        sender: 'You',
        role: 'student',
        text: `📎 Shared file: ${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB)`,
        time: 'Just now',
      },
    ])

    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  useEffect(() => {
    setInternalTab(activeTab)
  }, [activeTab])

  useEffect(() => {
    if (tab === 'chat') chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    if (tab === 'ai') aiEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, aiMessages, tab])

  const sendMessage = () => {
    if (!message.trim()) return
    setMessages((prev) => [
      ...prev,
      { id: String(Date.now()), sender: 'You', role: 'student', text: message, time: 'Just now' },
    ])
    setMessage('')
  }

  const sendAIMessage = (text: string) => {
    if (!text.trim()) return
    const userMsg: AIMessage = { id: String(Date.now()), role: 'user', text }
    setAiMessages((prev) => [...prev, userMsg])
    setAiInput('')
    setIsAIThinking(true)

    setTimeout(() => {
      let response = `Great question! Based on your current study session context:\n\n1. **Core Concept**: The relationship between variables here follows standard rules.\n2. **Solution Step**: Apply the derivative rule directly to each term.\n3. **Result**: Simplify the final expression.\n\nLet me know if you want me to work through a specific problem on the whiteboard!`
      if (text.includes('Formula')) {
        response = `**Formula Explanation** 🧮\n\nFor the Chain Rule: \\( \\frac{d}{dx} f(g(x)) = f'(g(x)) \\cdot g'(x) \\)\n\n- **Outer derivative**: Differentiate the outer function evaluated at inner function.\n- **Inner derivative**: Multiply by derivative of inner function.`
      } else if (text.includes('Debug')) {
        response = `**Code Diagnostic** 🐛\n\n- Check variable scope and loop termination conditions.\n- Ensure array indices stay within bounds.\n- Check return type matches function signature.`
      } else if (text.includes('Summarize')) {
        response = `**Session Summary** 📝\n\n- **Topic**: Derivatives & Calculus\n- **Key Discussion**: Chain Rule application\n- **Whiteboard Status**: Active diagrams created by tutor & student.`
      }

      setAiMessages((prev) => [...prev, { id: String(Date.now() + 1), role: 'assistant', text: response }])
      setIsAIThinking(false)
    }, 1000)
  }

  const sendReaction = (emoji: string) => {
    setMessages((prev) => [
      ...prev,
      { id: String(Date.now()), sender: 'You', role: 'student', text: emoji, time: 'Just now' },
    ])
    setShowReactions(false)
  }

  const tabs: { key: ChatTab; icon: React.ReactNode; label: string; count?: number }[] = [
    { key: 'chat', icon: <MessageCircle size={13} />, label: 'Chat' },
    { key: 'participants', icon: <Users size={13} />, label: 'People', count: participants.length },
    { key: 'resources', icon: <FolderOpen size={13} />, label: 'Files', count: resources.length },
  ]

  return (
    <div className="flex flex-col h-full w-full bg-white relative">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf,.doc,.docx,.txt"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Tab Header */}
      <div className="flex items-center border-b border-[#e5e5e7] shrink-0 px-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-[11px] font-semibold tracking-wide transition-all cursor-pointer select-none border-b-2 ${
              tab === t.key
                ? 'text-[#0066cc] border-[#0066cc]'
                : 'text-[#a1a1a6] border-transparent hover:text-[#525252]'
            }`}
          >
            {t.icon}
            {t.label}
            {t.count !== undefined && (
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                tab === t.key ? 'bg-[#0066cc]/10 text-[#0066cc]' : 'bg-[#f0f0f2] text-[#a1a1a6]'
              }`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {/* Chat Tab */}
        {tab === 'chat' && (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
              {messages.map((msg) => (
                <div key={msg.id}>
                  {msg.role === 'system' ? (
                    <div className="text-center py-2">
                      <span className="text-[10px] text-[#a1a1a6] bg-[#f5f5f7] rounded-full px-3.5 py-1.5 font-medium inline-flex items-center gap-1.5">
                        <Sparkles size={10} className="text-[#0066cc]" />
                        {msg.text}
                      </span>
                    </div>
                  ) : (
                    <div className={`flex gap-2.5 ${msg.sender === 'You' ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0 shadow-md ${
                        msg.role === 'tutor' ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 'bg-gradient-to-br from-[#0066cc] to-indigo-600'
                      }`}>
                        {msg.sender.charAt(0)}
                      </div>
                      <div className={`max-w-[78%] ${msg.sender === 'You' ? 'text-right' : ''}`}>
                        <div className={`flex items-center gap-1.5 mb-1 ${msg.sender === 'You' ? 'justify-end' : ''}`}>
                          <span className="text-[11px] font-semibold text-[#1d1d1f]">{msg.sender}</span>
                          {msg.role === 'tutor' && (
                            <span className="text-[8px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-100">TUTOR</span>
                          )}
                          <span className="text-[9px] text-[#c0c0c4]">{msg.time}</span>
                        </div>
                        <div className={`inline-block px-3.5 py-2.5 rounded-2xl text-[12.5px] leading-relaxed ${
                          msg.sender === 'You'
                            ? 'bg-[#0066cc] text-white rounded-br-md'
                            : 'bg-[#f0f0f2] text-[#1d1d1f] rounded-bl-md'
                        }`}>
                          {msg.text}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
          </div>
        )}

        {/* Socrates AI Copilot Tab */}
        {tab === 'ai' && (
          <div className="flex flex-col h-full bg-[#fafbfc]">
            {/* Quick Action Chips */}
            <div className="p-3 border-b border-[#e5e5e7] bg-white shrink-0">
              <div className="text-[10px] font-bold text-[#a1a1a6] uppercase tracking-wider mb-2">
                Quick Copilot Actions
              </div>
              <div className="flex flex-col gap-1.5">
                {QUICK_ACTIONS.map((act) => (
                  <button
                    key={act.label}
                    onClick={() => sendAIMessage(act.prompt)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#f5f5f7] hover:bg-[#0066cc]/10 hover:text-[#0066cc] text-xs font-medium text-[#525252] border border-[#e5e5e7] transition-all cursor-pointer text-left"
                  >
                    {act.icon}
                    <span>{act.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* AI Messages Feed */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {aiMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm ${
                      msg.role === 'assistant'
                        ? 'bg-gradient-to-br from-[#0066cc] to-purple-600'
                        : 'bg-[#1d1d1f]'
                    }`}
                  >
                    {msg.role === 'assistant' ? <Bot size={14} /> : 'Y'}
                  </div>
                  <div
                    className={`inline-block px-3.5 py-2.5 rounded-2xl text-[12px] leading-relaxed max-w-[85%] ${
                      msg.role === 'user'
                        ? 'bg-[#0066cc] text-white rounded-br-md'
                        : 'bg-white border border-[#e5e5e7] text-[#1d1d1f] shadow-sm rounded-bl-md whitespace-pre-wrap'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}

              {isAIThinking && (
                <div className="flex items-center gap-2 px-3 py-2 text-xs text-[#a1a1a6] italic">
                  <Bot size={14} className="animate-spin text-[#0066cc]" />
                  <span>Socrates AI is thinking...</span>
                </div>
              )}
              <div ref={aiEndRef} />
            </div>
          </div>
        )}

        {/* Participants Tab */}
        {tab === 'participants' && (
          <div className="p-3 space-y-2">
            <div className="text-[10px] font-bold text-[#a1a1a6] uppercase tracking-wider px-1 mb-3">
              In this session
            </div>
            {participants.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-2xl bg-[#fafafa] border border-[#f0f0f2] hover:border-[#e0e0e2] transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm ${
                    p.role === 'tutor' ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 'bg-gradient-to-br from-[#0066cc] to-indigo-600'
                  }`}>
                    {p.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-[#1d1d1f]">{p.name}</div>
                    <div className={`text-[9px] font-bold uppercase tracking-wider ${
                      p.role === 'tutor' ? 'text-emerald-600' : 'text-[#0066cc]'
                    }`}>
                      {p.role}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {p.isHandRaised && (
                    <span className="p-1.5 rounded-lg bg-amber-50 border border-amber-200">
                      <Hand size={11} className="text-amber-600" />
                    </span>
                  )}
                  {p.isMuted && (
                    <span className="p-1.5 rounded-lg bg-red-50 border border-red-200">
                      <MicOff size={11} className="text-red-400" />
                    </span>
                  )}
                  {!p.isMuted && !p.isHandRaised && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400" title="Connected" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Resources / Files Tab */}
        {tab === 'resources' && (
          <div className="p-3 space-y-3">
            {/* Interactive File Upload Card */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="p-3.5 border-2 border-dashed border-[#0066cc]/30 hover:border-[#0066cc] rounded-2xl bg-[#0066cc]/5 hover:bg-[#0066cc]/10 transition-all cursor-pointer flex items-center justify-center gap-2 text-[#0066cc] group select-none"
            >
              <Upload size={16} className="group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold">Upload Document / File</span>
            </div>

            <div className="text-[10px] font-bold text-[#a1a1a6] uppercase tracking-wider px-1 pt-1">
              Shared files ({resources.length})
            </div>

            {resources.map((r) => (
              <div
                key={r.id}
                onClick={() => setPreviewFile(r)}
                className="flex items-center gap-3 p-3 rounded-2xl bg-[#fafafa] border border-[#f0f0f2] hover:border-[#0066cc]/30 hover:bg-white transition-all cursor-pointer group shadow-2xs"
              >
                <div className={`p-2.5 rounded-xl shadow-sm ${
                  r.type === 'pdf'
                    ? 'bg-red-50 border border-red-100'
                    : 'bg-blue-50 border border-blue-100'
                }`}>
                  {r.type === 'pdf' ? (
                    <FileText size={16} className="text-red-500" />
                  ) : (
                    <ImageIcon size={16} className="text-blue-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-[#1d1d1f] truncate group-hover:text-[#0066cc] transition-colors">{r.name}</div>
                  <div className="text-[10px] text-[#a1a1a6]">
                    {r.uploadedBy} • {r.time} • {r.size}
                  </div>
                </div>
                <Eye size={14} className="text-[#a1a1a6] group-hover:text-[#0066cc] transition-colors shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chat Input (visible only on chat tab) */}
      {tab === 'chat' && (
        <div className="p-3 border-t border-[#e5e5e7] shrink-0 bg-white">
          <div className="flex items-center gap-1.5 bg-[#f5f5f7] rounded-2xl border border-[#e0e0e2] p-1.5 focus-within:border-[#0066cc]/30 focus-within:ring-2 focus-within:ring-[#0066cc]/8 transition-all">
            <div className="relative flex items-center gap-1">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-xl text-[#a1a1a6] hover:text-[#0066cc] hover:bg-white transition-all cursor-pointer"
                title="Attach file"
              >
                <Paperclip size={15} />
              </button>
              <button
                onClick={() => setShowReactions(!showReactions)}
                className="p-2 rounded-xl text-[#a1a1a6] hover:text-[#525252] hover:bg-white transition-all cursor-pointer"
                title="Reactions"
              >
                <SmilePlus size={15} />
              </button>
              {showReactions && (
                <div className="absolute bottom-full left-0 mb-2 flex gap-1 bg-white border border-[#e5e5e7] rounded-2xl shadow-xl shadow-black/8 p-2 z-50">
                  {QUICK_REACTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => sendReaction(emoji)}
                      className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-[#f0f0f2] text-lg cursor-pointer transition-transform hover:scale-110"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type a message..."
              className="flex-1 text-xs bg-transparent outline-none text-[#1d1d1f] placeholder:text-[#c0c0c4] px-1"
            />
            <button
              onClick={sendMessage}
              disabled={!message.trim()}
              className="p-2 rounded-xl bg-[#0066cc] text-white hover:bg-[#0077ed] transition-all cursor-pointer disabled:opacity-25 shadow-sm shadow-[#0066cc]/20"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}

      {/* AI Input (visible on AI tab) */}
      {tab === 'ai' && (
        <div className="p-3 border-t border-[#e5e5e7] shrink-0 bg-white">
          <div className="flex items-center gap-1.5 bg-[#f5f5f7] rounded-2xl border border-[#e0e0e2] p-1.5 focus-within:border-[#0066cc]/30 focus-within:ring-2 focus-within:ring-[#0066cc]/8 transition-all">
            <input
              type="text"
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendAIMessage(aiInput)}
              placeholder="Ask Socrates AI anything..."
              className="flex-1 text-xs bg-transparent outline-none text-[#1d1d1f] placeholder:text-[#c0c0c4] px-2"
            />
            <button
              onClick={() => sendAIMessage(aiInput)}
              disabled={!aiInput.trim() || isAIThinking}
              className="p-2 rounded-xl bg-gradient-to-r from-[#0066cc] to-purple-600 text-white hover:opacity-90 transition-all cursor-pointer disabled:opacity-25 shadow-sm"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}

      {/* File Preview Modal (Large Window) */}
      {previewFile && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-[#e5e5e7] shadow-2xl w-[90vw] max-w-4xl h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e5e7] bg-[#fafafa]">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`p-2.5 rounded-2xl ${previewFile.type === 'pdf' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                  {previewFile.type === 'pdf' ? <FileText size={20} /> : <ImageIcon size={20} />}
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-[#1d1d1f] truncate">{previewFile.name}</h4>
                  <span className="text-xs text-[#7a7a7a]">Uploaded by {previewFile.uploadedBy} • {previewFile.size} • {previewFile.time}</span>
                </div>
              </div>
              <button
                onClick={() => setPreviewFile(null)}
                className="p-2 rounded-2xl hover:bg-[#f0f0f2] text-[#7a7a7a] hover:text-[#1d1d1f] transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body / Viewer */}
            <div className="flex-1 p-6 flex items-center justify-center bg-[#f5f5f7] overflow-y-auto">
              {previewFile.url ? (
                previewFile.type === 'image' ? (
                  <img src={previewFile.url} alt={previewFile.name} className="max-h-[65vh] rounded-2xl object-contain shadow-xl" />
                ) : (
                  <iframe src={previewFile.url} title={previewFile.name} className="w-full h-[65vh] rounded-2xl border border-[#e5e5e7] bg-white shadow-sm" />
                )
              ) : (
                <div className="text-center py-12 space-y-4">
                  <div className="w-20 h-20 rounded-3xl bg-white shadow-lg flex items-center justify-center mx-auto text-[#0066cc]">
                    {previewFile.type === 'pdf' ? <FileText size={36} /> : <ImageIcon size={36} />}
                  </div>
                  <div>
                    <p className="text-base font-bold text-[#1d1d1f]">{previewFile.name}</p>
                    <p className="text-xs text-[#7a7a7a] mt-1">Shared by {previewFile.uploadedBy} • {previewFile.size}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-[#e5e5e7] bg-white flex items-center justify-between">
              <span className="text-xs text-[#a1a1a6]">SOCRATES Study Session File Viewer</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPreviewFile(null)}
                  className="px-5 py-2.5 rounded-2xl text-xs font-semibold text-[#525252] hover:bg-[#f0f0f2] transition-colors cursor-pointer"
                >
                  Close
                </button>
                {previewFile.url && (
                  <a
                    href={previewFile.url}
                    download={previewFile.name}
                    className="px-5 py-2.5 rounded-2xl text-xs font-semibold bg-[#0066cc] text-white hover:bg-[#0077ed] flex items-center gap-2 transition-colors cursor-pointer shadow-md shadow-[#0066cc]/20"
                  >
                    <Download size={15} /> Download File
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
