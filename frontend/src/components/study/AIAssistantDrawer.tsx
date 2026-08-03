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

interface AIMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
}

interface AIAssistantDrawerProps {
  isOpen: boolean
  onClose: () => void
}

const QUICK_ACTIONS = [
  { icon: <Calculator size={14} />, label: 'Explain Formula', prompt: 'Explain this formula step by step:' },
  { icon: <Bug size={14} />, label: 'Debug Code', prompt: 'Debug this code and find any errors:' },
  { icon: <FileText size={14} />, label: 'Summarize Session', prompt: 'Summarize the key takeaways from this study session.' },
  { icon: <HelpCircle size={14} />, label: 'Practice Quiz', prompt: 'Generate 3 practice quiz questions on the current topic.' },
]

const AI_RESPONSES: Record<string, string> = {
  'Explain this formula step by step:': `**The Derivative Rule (Chain Rule)**

Given f(g(x)), the derivative is:

\`f'(g(x)) · g'(x)\`

**Step 1:** Identify the outer function f and inner function g.
**Step 2:** Differentiate the outer function, keeping the inner function intact.
**Step 3:** Multiply by the derivative of the inner function.

**Example:** d/dx [sin(x²)] = cos(x²) · 2x`,

  'Debug this code and find any errors:': `🔍 **Code Analysis Complete**

I found **2 potential issues**:

1. **Line 5:** Missing semicolon at end of statement. Add \`;\` after the expression.
2. **Line 12:** Variable \`result\` may be used before assignment. Initialize it with a default value.

**Suggested Fix:**
\`\`\`
let result = 0;  // Initialize with default
\`\`\`

The rest of the code looks clean! ✅`,

  'Summarize the key takeaways from this study session.': `📝 **Session Summary**

**Topic:** Advanced Calculus — Derivatives & Integrals

**Key Takeaways:**
• Reviewed the **Chain Rule** for composite functions
• Practiced **integration by parts** with 3 examples
• Discussed **real-world applications** in physics (velocity → acceleration)

**Action Items:**
- Complete practice problems 4.1–4.8
- Review the whiteboard export for formula reference
- Next session: **Multivariable Calculus**`,

  'Generate 3 practice quiz questions on the current topic.': `📋 **Practice Quiz — Derivatives**

**Q1.** Find the derivative of f(x) = 3x⁴ + 2x² − 7x + 1

**Q2.** Apply the chain rule to differentiate g(x) = sin(2x³ + 1)

**Q3.** Find the second derivative of h(x) = e^(2x) · cos(x)

*Take your time and work through each step! I'm here to help if you get stuck.* 💪`,
}

export default function AIAssistantDrawer({ isOpen, onClose }: AIAssistantDrawerProps) {
  const [input, setInput] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: '0',
      role: 'assistant',
      text: "Hey! I'm **Socrates AI** 🤖 — your study copilot. Ask me anything about your session, or use the quick actions below!",
    },
  ])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = (text: string) => {
    if (!text.trim()) return
    const userMsg: AIMessage = { id: String(Date.now()), role: 'user', text }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsThinking(true)

    setTimeout(() => {
      // Match known prompts or give generic response
      let response =
        AI_RESPONSES[text] ||
        `Great question! Based on the current session context, here's my analysis:\n\n${text.length > 20 ? 'I\'ve reviewed the topic thoroughly. ' : ''}The key concept here involves understanding the fundamental relationship between the variables. Let me break it down:\n\n1. **First**, identify the core components\n2. **Then**, apply the relevant formula or method\n3. **Finally**, verify your answer\n\nWant me to elaborate on any specific step?`

      const aiMsg: AIMessage = { id: String(Date.now() + 1), role: 'assistant', text: response }
      setMessages((prev) => [...prev, aiMsg])
      setIsThinking(false)
    }, 1200 + Math.random() * 800)
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
              onClick={() => sendMessage(action.prompt)}
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
