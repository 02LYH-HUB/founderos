"use client"

import { useState, useEffect, useRef } from "react"
import ReportRenderer from "@/components/report/ReportRenderer"

/* ── Proactive suggestions after each module ── */
const MODULES = [
  {
    id: "research", icon: "📊", title: "Market Research",
    desc: "Deep-dive industry analysis",
    questions: [
      {
        q: "What problem are you solving?",
        opts: ["Too much manual work", "Lack of information", "High cost", "Poor user experience", "Fragmented tools", "✏️ Other"]
      },
      {
        q: "Who experiences this problem?",
        opts: ["Young professionals 20-30", "Small business owners", "Enterprise teams", "Consumers / everyone", "Developers & engineers", "✏️ Other"]
      },
      {
        q: "How do people solve this today?",
        opts: ["Excel / spreadsheets", "Manual process / no tool", "Expensive enterprise software", "Free but limited tools", "Hiring freelancers", "✏️ Other"]
      },
      {
        q: "How big is this market opportunity?",
        opts: ["Niche (<$100M market)", "Growing ($100M-$1B)", "Massive (>$1B)", "Not sure, need data", "✏️ Other"]
      },
      {
        q: "What's your unique advantage?",
        opts: ["10x cheaper", "AI-powered automation", "Better UX / simpler", "Network effects", "First mover in niche", "✏️ Other"]
      },
    ],
    engine: "research",
  },
  {
    id: "bm", icon: "🎯", title: "Business Model Canvas",
    desc: "9-module strategy blueprint",
    questions: [
      { q: "Who is your paying customer?", opts: ["Individuals (B2C)", "Businesses (B2B)", "Both (platform)", "Not sure yet", "✏️ Other"] },
      { q: "What's your core value proposition?", opts: ["Save time", "Save money", "Increase revenue", "Reduce risk", "Better experience", "✏️ Other"] },
      { q: "How will you acquire customers?", opts: ["SEO / content", "Social media ads", "Cold outreach / email", "App Store / marketplace", "Word of mouth / referrals", "✏️ Other"] },
      { q: "What's your pricing model?", opts: ["Free + premium", "Monthly subscription", "One-time purchase", "Usage-based / metered", "Commission / marketplace", "✏️ Other"] },
      { q: "What's your biggest cost driver?", opts: ["Engineering / dev", "Marketing / ads", "Sales team", "Server / infra", "Customer support", "✏️ Other"] },
    ],
    engine: "bm",
  },
  {
    id: "roadmap", icon: "🗺️", title: "Startup Roadmap",
    desc: "Phased execution plan",
    questions: [
      { q: "What's your current stage?", opts: ["Just an idea", "Built a prototype", "Launched MVP", "Have paying users", "Growing fast", "✏️ Other"] },
      { q: "What do you need to prove first?", opts: ["People want this (demand)", "People will pay (revenue)", "It can scale (tech)", "We can grow (marketing)", "Unit economics work", "✏️ Other"] },
      { q: "Who's on your team?", opts: ["Just me (solo founder)", "Me + co-founder", "2-5 people", "5+ people", "✏️ Other"] },
      { q: "What's your monthly budget?", opts: ["<$500 (bootstrapping)", "$500-$2K", "$2K-$10K", "$10K+ (funded)", "✏️ Other"] },
      { q: "What does success look like in 6 months?", opts: ["10+ paying users", "$1K monthly revenue", "Product-market fit", "Ready to raise funding", "Sustainable side income", "✏️ Other"] },
    ],
    engine: "roadmap",
  },
  {
    id: "idea", icon: "💡", title: "Idea Validation",
    desc: "Stress-test your concept",
    questions: [
      { q: "Where did this idea come from?", opts: ["Personal pain point", "Saw a market gap", "Friend/family need", "Trend I noticed", "Previous work experience", "✏️ Other"] },
      { q: "What's the simplest version you can build?", opts: ["A landing page", "A no-code prototype", "A manual service (do it by hand)", "Waitlist + community", "Basic MVP with core feature", "✏️ Other"] },
      { q: "What's the biggest risk?", opts: ["Nobody wants it (market)", "Can't build it (tech)", "Can't make money (revenue)", "Competitors will crush us", "I'll lose motivation", "✏️ Other"] },
      { q: "Have you validated this with anyone?", opts: ["Not yet", "Talked to 5-10 people", "Got a waitlist signups", "Someone said they'd pay", "Already have customers", "✏️ Other"] },
      { q: "If this fails, why?", opts: ["No real demand", "Ran out of time/money", "Better competitor", "Couldn't acquire users", "Lost interest", "✏️ Other"] },
    ],
    engine: "chat",
  },
]

export default function ChatPage() {
  const [projectId, setProjectId] = useState<string | null>(null)
  const [projectName, setProjectName] = useState("")
  const [activeModule, setActiveModule] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState<{ title: string; content: string } | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Interview state
  const [qIndex, setQIndex] = useState(0)
  const [answers, setAnswers] = useState<string[]>([])
  const [input, setInput] = useState("")
  const [chatHistory, setChatHistory] = useState<{ role: "assistant" | "user"; content: string }[]>([])

  useEffect(() => {
    fetch("/api/dashboard")
      .then(r => r.json())
      .then(d => { if (d.project?.id) { setProjectId(d.project.id); setProjectName(d.project.name) } })
      .catch(() => setError("项目加载失败"))
  }, [])

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }) }, [chatHistory, result])

  const currentModule = MODULES.find(m => m.id === activeModule)

  function startModule(id: string) {
    setActiveModule(id)
    setQIndex(0)
    setAnswers([])
    setChatHistory([])
    setResult(null)
    setInput("")
  }

  function handlePick(choice: string) {
    if (!currentModule) return
    const answer = choice === "✏️ Other" ? input.trim() || "Other" : choice
    if (choice === "✏️ Other" && !input.trim()) return
    
    setInput("")
    const newAnswers = [...answers, answer]
    setAnswers(newAnswers)
    setChatHistory(prev => [...prev, { role: "user", content: answer }])

    if (qIndex < currentModule.questions.length - 1) {
      const nextQ = qIndex + 1
      setQIndex(nextQ)
      setChatHistory(prev => [...prev, { role: "assistant", content: currentModule.questions[nextQ].q }])
    } else {
      generate(currentModule, newAnswers)
    }
  }

  function handleAnswer() {
    if (!input.trim()) return
    handlePick(input.trim())
  }

  async function generate(mod: typeof MODULES[0], ans: string[]) {
    setGenerating(true)
    setChatHistory(prev => [...prev, { role: "assistant", content: "分析中..." }])

    const context = mod.questions.map((q, i) => `Q: ${q.q}\nA: ${ans[i]}`).join("\n\n")

    try {
      if (mod.engine === "research") {
        const r = await fetch("/api/research", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic: ans[0], context }),
        })
        const d = await r.json()
        if (d.report) {
          const sections = d.report.sections
          const scores = d.report.scores
          const md = [
            `## 📊 Executive Summary\n${d.report.summary || ""}`,
            scores ? `\n## 🎯 Scores\n${Object.entries(scores).map(([k,v]) => `- **${k}**: ${"⭐".repeat(Math.round(Number(v)/2))} ${v}/10`).join("\n")}` : "",
            sections?.marketOverview ? `\n## 🌍 Market Overview\n${sections.marketOverview}` : "",
            sections?.competitorLandscape ? `\n## ⚔️ Competitor Landscape\n${sections.competitorLandscape}` : "",
            sections?.unitEconomics ? `\n## 💰 Unit Economics\n${sections.unitEconomics}` : "",
            sections?.goToMarket ? `\n## 🚀 Go-to-Market\n${sections.goToMarket}` : "",
            sections?.risksAndMitigation ? `\n## ⚠️ Risks\n${sections.risksAndMitigation}` : "",
            sections?.financialProjections ? `\n## 📈 Financial Projections\n${sections.financialProjections}` : "",
            d.report.recommendation ? `\n## 💡 Recommendation\n${d.report.recommendation}` : "",
          ].filter(Boolean).join("\n")
          setResult({ title: `Market Research: ${ans[0]?.slice(0, 40) || "Analysis"}`, content: md })
          setSuggestions(["Generate a Business Model Canvas based on this research", "Create a 3-month roadmap for this market", "Validate this idea with a deeper customer analysis"])
        }
      } else if (mod.engine === "bm") {
        const r = await fetch("/api/business-model", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ industry: ans[0], customerType: "B2C", context }),
        })
        const d = await r.json()
        if (d.summary) {
          const canvas = d.canvas ? `\n## 🎨 Canvas\n${Object.entries(d.canvas as Record<string,string>).map(([k,v]) => `**${k}**: ${v}`).join("\n\n")}` : ""
          const metrics = d.metrics ? `\n## 📊 Key Metrics\n${Object.entries(d.metrics).map(([k,v]) => `- **${k}**: ${v}`).join("\n")}` : ""
          const risks = d.risks ? `\n## ⚠️ Risks\n${d.risks.map((r: string) => `- ${r}`).join("\n")}` : ""
          const next = d.nextSteps ? `\n## ✅ Next Steps\n${d.nextSteps.map((s: string) => `- ${s}`).join("\n")}` : ""
          setResult({ title: `Business Model: ${ans[0]?.slice(0, 40) || "Canvas"}`, content: `## Summary\n${d.summary}${metrics}${canvas}${risks}${next}` })
          setSuggestions(["Create a 3-month roadmap based on this business model", "Research your target customer segment in depth", "Validate your pricing with a quick survey"])
        }
      } else if (mod.engine === "roadmap") {
        const r = await fetch("/api/roadmap", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stage: ans[0], timeline: "6 个月", context }),
        })
        const d = await r.json()
        if (d.summary) {
          const phases = d.phases ? `\n## 📅 Phases\n${d.phases.map((p:any) => `### ${p.name} (${p.duration}) — KPI: ${p.kpi}\n${p.objective}\n${p.tasks.map((t:any) => `- [${t.priority}] ${t.title} (${t.effort}, ${t.cost})`).join("\n")}`).join("\n\n")}` : ""
          const riskLog = d.riskLog ? `\n## ⚠️ Risk Log\n${d.riskLog.map((r:any) => `- **${r.risk}** (${r.probability}/${r.impact}): ${r.mitigation}`).join("\n")}` : ""
          const resources = d.resourcePlan ? `\n## 👥 Resource Plan\n${d.resourcePlan.map((r:any) => `- ${r.role}: ${r.when} — ${r.cost} ${r.fullTime ? "(full-time)" : ""}`).join("\n")}` : ""
          const finance = d.financialProjection ? `\n## 💰 Financial\n${d.financialProjection.map((f:any) => `Month ${f.month}: burn ${f.burn}, rev ${f.revenue} → ${f.milestone}`).join("\n")}` : ""
          const now = d.nextActions ? `\n## ⚡ This Week\n${d.nextActions.map((a: string) => `- ${a}`).join("\n")}` : ""
          setResult({ title: `Roadmap: ${ans[0]?.slice(0, 30) || "6-Month Plan"}`, content: `## Summary\n${d.summary}${phases}${riskLog}${resources}${finance}${now}` })
          setSuggestions(["Start Week 1 tasks now — track them in your dashboard", "Generate a business model canvas if you haven't yet", "Share this roadmap with your co-founder or advisor"])
        }
      } else {
        // Idea → chat
        const r = await fetch("/api/chat", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId,
            message: `Validate this startup idea with the following context:\n\n${context}\n\nProvide a structured analysis: 1) Market fit (1-10 score with reasoning), 2) Biggest risk, 3) Go/no-go recommendation, 4) First step to take.`,
          }),
        })
        const reader = r.body?.getReader()
        const decoder = new TextDecoder()
        let text = ""
        if (reader) {
          while (true) { const { done, value } = await reader.read(); if (done) break; text += decoder.decode(value, { stream: true }) }
        }
        setResult({ title: `Idea Validation: ${ans[0]?.slice(0, 40) || "Analysis"}`, content: text })
      }
    } catch (e: any) {
      setError(e.message || "生成失败")
    }
    setGenerating(false)
    setChatHistory(prev => {
      const updated = [...prev]
      updated[updated.length - 1] = { role: "assistant", content: "✅ 分析完成，请看下方报告。" }
      return updated
    })
  }

  // ── Initial module selection ──
  if (!activeModule) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] px-6 py-10 lg:px-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: "Outfit, sans-serif" }}>AI Co-founder</h1>
            <p className="text-sm text-[#71717a]">I'll ask you a few deep questions, then deliver a tailored recommendation. Pick a module to begin.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {MODULES.map(m => (
              <button key={m.id} onClick={() => startModule(m.id)}
                className="p-6 rounded-2xl bg-[#18181b] border border-[#27272a] text-left hover:border-[#9FFF00]/30 transition-all cursor-pointer group"
              >
                <div className="text-3xl mb-3">{m.icon}</div>
                <h3 className="text-base font-bold text-white mb-1">{m.title}</h3>
                <p className="text-sm text-[#71717a]">{m.desc}</p>
                <p className="text-xs text-[#9FFF00]/50 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  5 deep questions →
                </p>
              </button>
            ))}
          </div>
          {error && <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">{error}</div>}
        </div>
      </div>
    )
  }

  // ── Interview chat ──
  return (
    <div className="flex flex-col h-screen bg-[#0a0a0f]">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[#1a1a2e] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => { setActiveModule(null); setResult(null) }} className="text-[#71717a] hover:text-white text-sm">← Back</button>
          <h1 className="text-base font-semibold text-white">{currentModule?.icon} {currentModule?.title}</h1>
        </div>
        <span className="text-xs text-[#71717a]">
          {result ? "Done" : `Q${qIndex + 1}/${currentModule?.questions.length}`}
        </span>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        {/* Opening question */}
        <div className="flex gap-3">
          <div className="w-7 h-7 rounded-lg grid place-items-center text-xs font-bold bg-[#9FFF00] text-[#0a0a0f] flex-shrink-0">OS</div>
          <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-[#18181b] border border-[#27272a] text-sm text-[#fafafa] leading-relaxed">
            {currentModule?.questions[0]?.q}
          </div>
        </div>

        {/* Chat history */}
        {chatHistory.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`w-7 h-7 rounded-lg grid place-items-center text-xs font-bold flex-shrink-0 ${
              msg.role === "assistant" ? "bg-[#9FFF00] text-[#0a0a0f]" : "bg-[#27272a] text-white"
            }`}>
              {msg.role === "assistant" ? "OS" : "U"}
            </div>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              msg.role === "assistant"
                ? "bg-[#18181b] text-[#fafafa] border border-[#27272a]"
                : "bg-[#9FFF00]/10 text-[#e4e4e7] border border-[#9FFF00]/20"
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Result panel */}
      {result && (
        <div className="px-6 py-6 border-t border-[#1a1a2e] bg-[#0a0a0f]">
          <div className="max-w-4xl mx-auto">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white" style={{ fontFamily: "Outfit, sans-serif" }}>{result.title}</h2>
              <div className="flex gap-2">
                <button onClick={() => startModule(activeModule!)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-[#27272a] text-[#a1a1aa] hover:text-white transition-all cursor-pointer">
                  Try again
                </button>
                <button onClick={() => { setActiveModule(null); setResult(null); setSuggestions([]) }}
                  className="text-xs px-3 py-1.5 rounded-lg bg-[#9FFF00]/10 text-[#9FFF00] border border-[#9FFF00]/20 hover:bg-[#9FFF00]/20 transition-all cursor-pointer">
                  ← Back to modules
                </button>
              </div>
            </div>
            <ReportRenderer content={result.content} suggestions={suggestions} />
          </div>
        </div>
      )}

      {/* Input — choice buttons */}
      {!result && (
        <div className="px-6 py-4 border-t border-[#1a1a2e]">
          <div className="max-w-4xl mx-auto">
            {/* Quick-select buttons */}
            <div className="flex flex-wrap gap-2 mb-3">
              {currentModule?.questions[qIndex]?.opts.map((opt) => {
                const isOther = opt === "✏️ Other"
                return (
                  <button
                    key={opt}
                    onClick={() => {
                      if (isOther) return // handled by input
                      handlePick(opt)
                    }}
                    disabled={generating}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                      isOther
                        ? "text-[#71717a] bg-transparent border border-dashed border-[#27272a]"
                        : "bg-[#18181b] text-[#e4e4e7] border border-[#27272a] hover:border-[#9FFF00]/40 hover:text-white"
                    }`}
                  >
                    {opt}
                  </button>
                )
              })}
            </div>

            {/* Custom input */}
            <div className="flex gap-3">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && input.trim()) handleAnswer() }}
                placeholder="Or type your own answer..."
                disabled={generating}
                className="flex-1 bg-[#18181b] border border-[#27272a] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-[#71717a] focus:outline-none focus:border-[#9FFF00]/50 disabled:opacity-50"
              />
              <button
                onClick={handleAnswer}
                disabled={!input.trim() || generating}
                className="px-4 py-2.5 rounded-xl bg-[#9FFF00] text-[#0a0a0f] font-semibold text-sm disabled:opacity-30 hover:bg-[#8ae600] transition-all cursor-pointer"
              >
                {generating ? "..." : "→"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
