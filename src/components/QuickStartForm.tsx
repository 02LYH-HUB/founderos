"use client"

import { useState, useEffect } from "react"
import AuthGuard from "./AuthGuard"

type Progress = {
  step: string
  label: string
  idea?: { problem: string; who: string }
  plan?: string
}

const STEPS = [
  { key: "idea", label: "Analyzing your idea...", icon: "💡" },
  { key: "research", label: "Researching the market...", icon: "📊" },
  { key: "bm", label: "Building business model...", icon: "🎯" },
  { key: "roadmap", label: "Planning your roadmap...", icon: "🗺️" },
  { key: "done", label: "Your plan is ready!", icon: "✅" },
]

export default function QuickStartForm() {
  const [input, setInput] = useState("")
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState<Progress | null>(null)
  const [plan, setPlan] = useState("")
  const [error, setError] = useState("")
  const [fastMode, setFastMode] = useState(false)

  // Restore last plan: localStorage first, then DB fallback
  useEffect(() => {
    const saved = localStorage.getItem("qs-plan")
    if (saved) {
      try { const p = JSON.parse(saved); setPlan(p.plan || ""); setInput(p.idea || "") } catch {}
      return
    }
    // localStorage empty — try loading from DB (survives cache clear / new device)
    fetch("/api/dashboard")
      .then(async r => { try { return await r.json() } catch { return {} } })
      .then(d => {
        const pid = d.project?.id
        if (!pid) return
        fetch(`/api/memory?projectId=${pid}&type=strategy`)
          .then(r => r.json())
          .then(d2 => {
            const mems = d2.memories || []
            if (mems.length > 0) {
              const latest = mems[0]
              setPlan(latest.content || "")
              setInput(latest.title?.replace(/^创业计划:\s*/, "") || "")
              localStorage.setItem("qs-plan", JSON.stringify({ plan: latest.content || "", idea: "" }))
            }
          })
          .catch(() => {})
      })
      .catch(() => {})
  }, [])

  function setPlanPersist(plan: string, idea?: string) {
    setPlan(plan)
    if (plan) localStorage.setItem("qs-plan", JSON.stringify({ plan, idea: idea || input }))
    else localStorage.removeItem("qs-plan")
  }

  async function startPipeline() {
    if (!input.trim() || input.length < 10) return
    setRunning(true); setError(""); setPlan(""); setProgress(null)

    try {
      const r = await fetch(`/api/pipeline?fast=${fastMode ? "1" : "0"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea: input.trim() }),
      })
      if (!r.ok) throw new Error(await r.text())
      const reader = r.body?.getReader()
      if (!reader) throw new Error("No stream")
      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() || ""
        for (const line of lines) {
          if (!line.trim()) continue
          try {
            const data = JSON.parse(line)
            if (data.step === "error") { setError(data.error || "Failed"); setRunning(false); return }
            setProgress(data)
            if (data.step === "done" && data.plan) setPlanPersist(data.plan, input)
          } catch {}
        }
      }
    } catch (e: any) { setError(e.message) }
    setRunning(false)
  }

  const currentStepIdx = STEPS.findIndex(s => s.key === progress?.step)
  const isDone = progress?.step === "done"

  return (
    <div className="mb-10">
      {/* Input */}
      <div className={`p-1 rounded-2xl transition-all duration-500 ${running ? "bg-[#9FFF00]/10" : "bg-[#18181b] border border-[#27272a] hover:border-[#9FFF00]/30"}`}>
        <div className="flex items-center gap-3 p-4">
          <div className="text-2xl flex-shrink-0">{isDone ? "✅" : "🚀"}</div>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !running) startPipeline() }}
            placeholder='Describe your idea — e.g. "A Notion-like tool for developers who hate organizing"'
            disabled={running}
            className="flex-1 bg-transparent text-white text-sm placeholder:text-[#71717a] focus:outline-none disabled:opacity-50"
          />
          <button
            onClick={() => setFastMode(!fastMode)}
            className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              fastMode ? "border-[#9FFF00]/50 bg-[#9FFF00]/10 text-[#9FFF00]" : "border-[#27272a] bg-transparent text-[#71717a]"
            }`}
            title={fastMode ? "Fast mode: skips reflection" : "Deep mode: 2-pass research"}
          >
            {fastMode ? "⚡ Fast" : "Deep"}
          </button>
          <AuthGuard>
            <button
              onClick={startPipeline}
              disabled={running || input.length < 10}
              className="px-5 py-2.5 rounded-xl bg-[#9FFF00] text-[#0a0a0f] font-bold text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#8ae600] transition-all cursor-pointer whitespace-nowrap"
            >
              {running ? "..." : "Generate Plan →"}
            </button>
          </AuthGuard>
        </div>
      </div>

      {/* Progress */}
      {progress && (
        <div className="mt-4 p-4 rounded-xl bg-[#18181b] border border-[#27272a]">
          <div className="flex items-center gap-3 mb-3">
            {STEPS.map((s, i) => {
              const active = i === currentStepIdx && !isDone
              const done = i < currentStepIdx || (isDone && i <= currentStepIdx)
              return (
                <div key={s.key} className="flex items-center gap-2 flex-1 last:flex-[0]">
                  <div className={`w-7 h-7 rounded-lg grid place-items-center text-sm font-bold transition-all ${
                    done ? "bg-[#9FFF00]/20 text-[#9FFF00]" : active ? "bg-[#9FFF00] text-[#0a0a0f] animate-pulse shadow-[0_0_12px_rgba(159,255,0,0.3)]" : "bg-[#1a1a2e] text-[#9FFF00]/60 border border-[#9FFF00]/10"
                  }`}>
                    {done ? "✓" : s.icon}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 rounded-full ${done ? "bg-[#9FFF00]/30" : "bg-[#27272a]"}`} />
                  )}
                </div>
              )
            })}
          </div>
          <div className="flex justify-between">
            {STEPS.map(s => (
              <span key={s.key} className={`text-[10px] ${
                STEPS.findIndex(x => x.key === s.key) < currentStepIdx || (isDone && STEPS.findIndex(x => x.key === s.key) <= currentStepIdx)
                  ? "text-[#9FFF00]"
                  : STEPS.findIndex(x => x.key === s.key) === currentStepIdx && !isDone
                  ? "text-[#9FFF00]"
                  : "text-[#71717a]"
              }`}>
                {s.label}
              </span>
            ))}
          </div>
          {progress.idea && (
            <div className="mt-3 text-xs text-[#a1a1aa]">
              Problem: <span className="text-white">{progress.idea.problem}</span> · Target: <span className="text-white">{progress.idea.who}</span>
            </div>
          )}
        </div>
      )}

      {/* Plan output */}
      {plan && (
        <div className="mt-6 p-6 rounded-2xl bg-[#18181b] border border-[#9FFF00]/20 max-h-[60vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white" style={{ fontFamily: "Outfit, sans-serif" }}>📋 Your Startup Plan</h2>
            <div className="flex gap-2">
              <button onClick={() => { setPlanPersist(""); setProgress(null); setInput("") }}
                className="text-xs px-3 py-1.5 rounded-lg bg-[#27272a] text-[#a1a1aa] hover:text-white transition-all cursor-pointer">
                {plan ? "Generate New Plan" : "Start Over"}
              </button>
              <button onClick={() => navigator.clipboard.writeText(plan)}
                className="text-xs px-3 py-1.5 rounded-lg bg-[#9FFF00]/10 text-[#9FFF00] border border-[#9FFF00]/20 hover:bg-[#9FFF00]/20 transition-all cursor-pointer">
                📋 Copy
              </button>
            </div>
          </div>
          <div className="text-sm text-[#a1a1aa] leading-relaxed whitespace-pre-wrap">{plan}</div>
        </div>
      )}

      {error && (
        <div className="mt-3 text-sm text-red-400">{error}</div>
      )}
    </div>
  )
}
