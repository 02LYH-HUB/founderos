"use client"

import { useState } from "react"

const AGENTS = [
  { id: "ceo", emoji: "🤖", name: "AI CEO", desc: "Vision, strategy, decisions", color: "#9FFF00", premium: true },
  { id: "pm", emoji: "🤖", name: "AI PM", desc: "Roadmaps, specs, prioritization", color: "#60a5fa", premium: true },
  { id: "engineer", emoji: "🛠️", name: "AI Engineer", desc: "Code, architecture, build plan", color: "#f472b6", premium: false },
  { id: "marketing", emoji: "📣", name: "AI Marketing", desc: "Campaigns, SEO, growth", color: "#a78bfa", premium: false },
  { id: "designer", emoji: "🎨", name: "AI Designer", desc: "UI, brand, design systems", color: "#fbbf24", premium: false },
  { id: "finance", emoji: "💰", name: "AI Finance", desc: "Pricing, forecasts, unit economics", color: "#34d399", premium: false },
]

export default function AgentPanel() {
  const [active, setActive] = useState<string | null>(null)
  const [input, setInput] = useState("")
  const [response, setResponse] = useState("")
  const [loading, setLoading] = useState(false)

  async function runAgent() {
    if (!active || !input.trim()) return
    setLoading(true); setResponse("")
    try {
      const r = await fetch("/api/agent", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: active, context: input.trim() }),
      })
      const d = await r.json()
      setResponse(d.content || d.error || "No response")
    } catch { setResponse("Error. Try again.") }
    setLoading(false)
  }

  return (
    <div>
      {/* Agent Grid */}
      {!active && (
        <div>
          <p className="text-xs text-[#71717a] mb-3 uppercase tracking-wide font-medium">🤖 Agent Panel</p>
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
            {AGENTS.map((a) => (
              <button key={a.id} onClick={() => setActive(a.id)}
                className={`group p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  a.premium ? "bg-gradient-to-br from-[#18181b] to-[#1a1a20] border-[#27272a] hover:border-[#9FFF00]/20" : "bg-[#18181b] border-[#27272a] hover:border-[#9FFF00]/10"
                }`}>
                <div className="text-2xl mb-2">{a.emoji}</div>
                <h3 className="text-sm font-bold text-white mb-0.5">{a.name}</h3>
                <p className="text-[10px] text-[#71717a]">{a.desc}</p>
                {a.premium && <span className="text-[9px] text-[#9FFF00]/40 mt-1 block">Active</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Agent Chat */}
      {active && (
        <div className="p-5 rounded-2xl bg-gradient-to-br from-[#18181b] to-[#1a1a20] border border-[#27272a]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white">
              {AGENTS.find(a => a.id === active)?.emoji} {AGENTS.find(a => a.id === active)?.name}
            </h3>
            <button onClick={() => { setActive(null); setResponse(""); setInput("") }}
              className="text-xs text-[#71717a] hover:text-white transition-colors cursor-pointer">← Back</button>
          </div>
          <textarea
            value={input} onChange={e => setInput(e.target.value)}
            placeholder="Describe what you need help with..."
            className="w-full p-3 rounded-xl bg-[#0a0a0f] border border-[#27272a] text-white text-sm outline-none focus:border-[#9FFF00]/30 resize-none mb-3"
            rows={3}
          />
          <button onClick={runAgent} disabled={loading || !input.trim()}
            className="px-4 py-2 rounded-xl bg-[#9FFF00] text-[#0a0a0f] font-bold text-sm hover:bg-[#8ae600] transition-all disabled:opacity-30 cursor-pointer">
            {loading ? "Thinking..." : "Ask Agent →"}
          </button>
          {response && (
            <div className="mt-4 p-4 rounded-xl bg-[#0a0a0f] border border-[#27272a] max-h-80 overflow-y-auto">
              <div className="text-sm text-[#e4e4e7] leading-relaxed whitespace-pre-wrap">{response}</div>
              <button onClick={() => navigator.clipboard.writeText(response)}
                className="mt-3 text-xs text-[#71717a] hover:text-white transition-colors cursor-pointer">📋 Copy</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
