import React, { useState, useRef, useEffect } from 'react'
import {
  X,
  Bot,
  Send,
  Calculator,
  Bug,
  FileText,
  HelpCircle,
  Loader2,
  Sparkles,
} from 'lucide-react'
import { askStudyRoomAICopilot } from '../../services/api'

interface AIMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
}

interface AIAssistantDrawerProps {
  isOpen: boolean
  onClose: () => void
  roomId?: string
  activeTopic?: string
  currentCode?: string
}

const QUICK_ACTIONS = [
  { icon: <Calculator size={14} />, label: 'Explain Formula', action: 'Explain Formula', prompt: 'Explain this formula step by step:' },
  { icon: <Bug size={14} />, label: 'Debug Code', action: 'Debug Code', prompt: 'Debug this code and find any errors:' },
  { icon: <FileText size={14} />, label: 'Summarize Session', action: 'Summarize Session', prompt: 'Summarize the key takeaways from this study session.' },
  { icon: <HelpCircle size={14} />, label: 'Practice Quiz', action: 'Practice Quiz', prompt: 'Generate 3 practice quiz questions on the current topic.' },
]

export default function AIAssistantDrawer({
  isOpen,
  onClose,
  roomId = 'demo-101',
  activeTopic = 'General Tutoring',
  currentCode = '',
}: AIAssistantDrawerProps) {
  const [input, setInput] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: '0',
      role: 'assistant',
      text: "Welcome to Socrates AI — your real-time study copilot. Ask any question about your session, or choose a quick action below.",
    },
  ])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text: string, quickAction?: string) => {
    if (!text.trim() && !quickAction) return
    const displayText = text || quickAction || ''
    const userMsg: AIMessage = { id: String(Date.now()), role: 'user', text: displayText }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsThinking(true)

    try {
      const res = await askStudyRoomAICopilot(roomId, {
        prompt: displayText,
        quickAction,
        currentCode,
        activeTopic,
      })

      const replyText =
        res?.data?.response ||
        res?.response ||
        "I've analyzed your question against the current study session context. Let me know which part you'd like to dive into further!"

      const aiMsg: AIMessage = { id: String(Date.now() + 1), role: 'assistant', text: replyText }
      setMessages((prev) => [...prev, aiMsg])
    } catch (err: any) {
      const fallbackText = `I'm analyzing **${activeTopic}**. Consider breaking down the formula or code snippet into its base cases, and let's work through it on the Whiteboard together.`
      const aiMsg: AIMessage = { id: String(Date.now() + 1), role: 'assistant', text: fallbackText }
      setMessages((prev) => [...prev, aiMsg])
    } finally {
      setIsThinking(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="flex flex-col h-full w-full bg-white animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#e5e5e7] shrink-0 bg-gradient-to-r from-[#0066cc]/5 to-purple-500/5">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-[#0066cc]/10">
            <Bot size={18} className="text-[#0066cc]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#1d1d1f]">Socrates AI</h3>
            <span className="text-[10px] text-[#7a7a7a] font-medium">Study Copilot</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-[#f0f0f2] text-[#7a7a7a] hover:text-[#1d1d1f] transition-all cursor-pointer"
        >
          <X size={16} />
        </button>
      </div>

      {/* Quick Actions */}
      <div className="px-3 py-2.5 border-b border-[#e5e5e7] shrink-0">
        <div className="flex gap-1.5 overflow-x-auto">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.label}
              onClick={() => sendMessage(action.prompt, action.action)}
              disabled={isThinking}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#f5f5f7] border border-[#e0e0e0] text-[10px] font-semibold text-[#525252] hover:bg-[#e8e8ed] hover:text-[#1d1d1f] transition-all cursor-pointer whitespace-nowrap disabled:opacity-40 select-none"
            >
              {action.icon}
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 min-h-0">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full bg-[#0066cc] flex items-center justify-center shrink-0">
                <Sparkles size={13} className="text-white" />
              </div>
            )}
            <div
              className={`max-w-[85%] px-3 py-2.5 rounded-xl text-xs leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-[#0066cc] text-white rounded-tr-sm'
                  : 'bg-[#f5f5f7] text-[#1d1d1f] rounded-tl-sm border border-[#e5e5e7]'
              }`}
            >
              {msg.text.split('**').map((part, i) =>
                i % 2 === 1 ? (
                  <strong key={i}>{part}</strong>
                ) : (
                  <span key={i}>{part}</span>
                )
              )}
            </div>
          </div>
        ))}

        {isThinking && (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#0066cc] flex items-center justify-center shrink-0">
              <Sparkles size={13} className="text-white" />
            </div>
            <div className="px-3 py-2.5 rounded-xl bg-[#f5f5f7] border border-[#e5e5e7] flex items-center gap-2">
              <Loader2 size={12} className="animate-spin text-[#0066cc]" />
              <span className="text-xs text-[#7a7a7a]">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-[#e5e5e7] shrink-0">
        <div className="flex items-center gap-1.5 bg-[#f5f5f7] rounded-xl border border-[#e0e0e0] p-1.5">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
            placeholder="Ask Socrates AI anything..."
            className="flex-1 text-xs bg-transparent outline-none text-[#1d1d1f] placeholder:text-[#a1a1a6] px-1.5"
            disabled={isThinking}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isThinking}
            className="p-1.5 rounded-lg bg-[#0066cc] text-white hover:bg-[#0077ed] transition-all cursor-pointer disabled:opacity-30"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
