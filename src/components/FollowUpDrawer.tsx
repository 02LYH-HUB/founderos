"use client"

import { useState, useRef, useEffect } from "react"

const AGENT_MAP: Record<string, { name: string; emoji: string }> = {
  ceo: { name: "AI CEO", emoji: "🤖" },
  pm: { name: "AI PM", emoji: "🤖" },
  engineer: { name: "AI Engineer", emoji: "🛠️" },
  marketing: { name: "AI Marketing", emoji: "📣" },
  designer: { name: "AI Designer", emoji: "🎨" },
  finance: { name: "AI Finance", emoji: "💰" },
}

export default function FollowUpDrawer({
  open,
  onClose,
  agentType,
  moduleTitle,
  moduleContent,
}: {
  open: boolean
  onClose: () => void
  agentType: string
  moduleTitle: string
  moduleContent: string
}) {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const agent = AGENT_MAP[agentType] || AGENT_MAP.ceo

  // Auto-send first message when drawer opens
  useEffect(() => {
    if (open && messages.length === 0) {
      const firstMsg = `I'd like to dive deeper into **${moduleTitle}**. Current content:\n\n${moduleContent.slice(0, 500)}\n\nWhat should I optimize or watch out for?`
      setMessages([{ role: "user", content: firstMsg }])
      sendToAgent([{ role: "user", content: firstMsg }])
    }
  }, [open])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages])

  async function sendToAgent(msgs: { role: string; content: string }[]) {
    setLoading(true)
    try {
      const r = await fetch("/api/agent", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: agentType, messages: msgs, moduleTitle, moduleContent }),
      })
      const d = await r.json()
      setMessages(prev => [...prev, { role: "assistant", content: d.content || d.error || "No response" }])
    } catch { setMessages(prev => [...prev, { role: "assistant", content: "Error. Try again." }]) }
    setLoading(false)
  }

  async function sendMessage() {
    if (!input.trim() || loading) return
    const newMsg = { role: "user" as const, content: input.trim() }
    const updated = [...messages, newMsg]
    setMessages(updated)
    setInput("")
    await sendToAgent(updated)
  }

  return (
    <>
      {/* Backdrop */}
      {open && <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />}

      {/* Drawer */}
      <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-[#0a0a0f] border-l border-[#27272a] z-50 transition-transform duration-300 flex flex-col ${open ? "translate-x-0" : "translate-x-full"}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#27272a]">
          <div>
            <span className="text-lg mr-2">{agent.emoji}</span>
            <span className="text-sm font-bold text-white">{agent.name}</span>
            <span className="text-xs text-[#71717a] ml-2">discussing {moduleTitle}</span>
          </div>
          <button onClick={onClose} className="text-[#71717a] hover:text-white transition-colors cursor-pointer text-lg">✕</button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                m.role === "user" ? "bg-[#9FFF00]/10 text-[#e4e4e7] border border-[#9FFF00]/10" : "bg-[#18181b] text-[#e4e4e7] border border-[#27272a]"
              }`}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="max-w-[85%] p-3 rounded-2xl bg-[#18181b] border border-[#27272a] text-sm text-[#71717a] animate-pulse">Thinking...</div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-5 py-4 border-t border-[#27272a]">
          <div className="flex gap-2">
            <input
              value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
              placeholder="Ask a follow-up..."
              className="flex-1 bg-[#18181b] border border-[#27272a] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-[#71717a] focus:outline-none focus:border-[#9FFF00]/30"
            />
            <button onClick={sendMessage} disabled={loading || !input.trim()}
              className="px-4 py-2.5 rounded-xl bg-[#9FFF00] text-[#0a0a0f] font-bold text-sm disabled:opacity-30 hover:bg-[#8ae600] transition-all cursor-pointer">
              Send
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
