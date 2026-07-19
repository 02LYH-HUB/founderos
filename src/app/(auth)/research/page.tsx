"use client"

import { useState, useEffect } from "react"

interface Report {
  id: string; topic: string; summary: string; status: string; createdAt: string
}

const INDUSTRIES = [
  "💻 科技/SaaS", "🏥 健康/医疗", "📚 教育/培训", "💰 金融/支付",
  "🛒 电商/零售", "🎮 游戏/娱乐", "🤖 AI/大模型", "✏️ 自定义",
]

export default function ResearchPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [topic, setTopic] = useState("")
  const [customTopic, setCustomTopic] = useState("")
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState("")
  const [projectId, setProjectId] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/dashboard")
      .then(async r => { try { return await r.json() } catch { return {} } })
      .then(d => { if (d.project?.id) { setProjectId(d.project.id); loadReports(d.project.id) } })
  }, [])

  function loadReports(pid: string) {
    fetch(`/api/research?projectId=${pid}`)
      .then(r => r.json())
      .then(d => setReports(d.reports || []))
      .catch(() => {})
  }

  async function generate() {
    const t = topic === "✏️ 自定义" ? customTopic : topic
    if (!t || !projectId) return
    setGenerating(true); setError("")
    try {
      const r = await fetch("/api/research", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: t }),
      })
      const data = await r.json()
      if (data.report) {
        setReports(prev => [data.report, ...prev])
        setSelectedReport(data.report)
      } else throw new Error(data.error)
    } catch (e: any) { setError(e.message || "生成失败") }
    setGenerating(false)
  }

  return (
    <div className="flex h-screen bg-[#0a0a0f]">
      {/* List */}
      <div className={`flex flex-col ${selectedReport ? "hidden md:flex md:w-80" : "flex-1"} border-r border-[#1a1a2e]`}>
        <div className="px-5 py-4 border-b border-[#1a1a2e]">
          <h1 className="text-lg font-semibold text-white mb-3" style={{ fontFamily: "Outfit, sans-serif" }}>Market Research</h1>
          <label className="text-xs text-[#a1a1aa] mb-2 block">选择行业</label>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {INDUSTRIES.map(ind => (
              <button key={ind} onClick={() => setTopic(ind)}
                className={`text-[11px] px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  topic === ind ? "bg-[#9FFF00]/15 text-[#9FFF00] border border-[#9FFF00]/30" : "text-[#71717a] bg-[#18181b] border border-[#27272a] hover:border-[#9FFF00]/20"
                }`}
              >{ind}</button>
            ))}
          </div>
          {topic === "✏️ 自定义" && (
            <input value={customTopic} onChange={e => setCustomTopic(e.target.value)}
              placeholder="输入行业名称..."
              className="w-full mb-3 bg-[#18181b] border border-[#27272a] rounded-xl px-3 py-2 text-sm text-white placeholder:text-[#71717a] focus:outline-none focus:border-[#9FFF00]/50"
            />
          )}
          <button onClick={generate} disabled={!topic || generating}
            className="w-full py-2.5 rounded-xl bg-[#9FFF00] text-[#0a0a0f] font-bold text-sm disabled:opacity-30 cursor-pointer hover:bg-[#8ae600] transition-all"
          >{generating ? "生成中..." : "生成报告 →"}</button>
          {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
        </div>

        <div className="flex-1 overflow-y-auto">
          {reports.map(r => (
            <button key={r.id} onClick={() => setSelectedReport(r)}
              className={`w-full text-left p-4 border-b border-[#1a1a2e] hover:bg-[#18181b] transition-all cursor-pointer ${
                selectedReport?.id === r.id ? "bg-[#18181b] border-l-2 border-l-[#9FFF00]" : ""
              }`}
            >
              <div className="text-[10px] text-[#71717a] mb-1">{new Date(r.createdAt).toLocaleDateString()}</div>
              <h3 className="text-sm font-medium text-white truncate">{r.topic}</h3>
              <p className="text-xs text-[#71717a] truncate mt-0.5">{r.summary?.slice(0, 80) || "No summary"}</p>
            </button>
          ))}
          {reports.length === 0 && !generating && (
            <div className="p-8 text-center text-sm text-[#71717a]">📈 No reports yet. Select a topic and generate.</div>
          )}
        </div>
      </div>

      {/* Detail */}
      {selectedReport && (
        <div className="flex-1 p-8 overflow-y-auto">
          <button onClick={() => setSelectedReport(null)} className="md:hidden text-sm text-[#71717a] mb-4">← Back</button>
          <div className="text-xs text-[#71717a] mb-2">{new Date(selectedReport.createdAt).toLocaleString()}</div>
          <h2 className="text-xl font-bold text-white mb-4" style={{ fontFamily: "Outfit, sans-serif" }}>{selectedReport.topic}</h2>
          <div className="text-sm text-[#a1a1aa] leading-relaxed whitespace-pre-wrap">{selectedReport.summary || "Loading report..."}</div>
        </div>
      )}
      {!selectedReport && (
        <div className="hidden md:flex flex-1 items-center justify-center text-sm text-[#71717a]">Select a report to view</div>
      )}
    </div>
  )
}
