"use client"

import { useState, useEffect } from "react"

interface Phase {
  name: string; duration: string; objective: string
  tasks: { title: string; priority: string }[]
}

export default function RoadmapPage() {
  const [projectId, setProjectId] = useState<string | null>(null)
  const [phases, setPhases] = useState<Phase[]>([])
  const [summary, setSummary] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/dashboard")
      .then(async r => { try { return await r.json() } catch { return {} } })
      .then(d => { if (d.project?.id) { setProjectId(d.project.id); loadRoadmap(d.project.id) } })
      .finally(() => setLoading(false))
  }, [])

  function loadRoadmap(pid: string) {
    fetch(`/api/roadmap?projectId=${pid}`)
      .then(r => r.json())
      .then(d => { if (d.phases) { setPhases(d.phases); setSummary(d.summary || "") } })
      .catch(() => {})
  }

  async function generateNew() {
    if (!projectId) return
    setLoading(true)
    try {
      const r = await fetch("/api/roadmap", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: "Idea (想法阶段)", timeline: "3 个月" }),
      })
      const d = await r.json()
      if (d.phases) { setPhases(d.phases); setSummary(d.summary || "") }
    } catch {}
    setLoading(false)
  }

  if (loading) return <div className="p-8 text-[#a1a1aa]">Loading...</div>

  if (phases.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0a0a0f]">
        <div className="text-center">
          <div className="text-5xl mb-4">🗺️</div>
          <h2 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>No Roadmap Yet</h2>
          <p className="text-sm text-[#71717a] mb-6">Generate your startup roadmap</p>
          <button onClick={generateNew} className="px-6 py-3 rounded-xl bg-[#9FFF00] text-[#0a0a0f] font-bold text-sm hover:bg-[#8ae600] transition-all cursor-pointer">
            Generate Roadmap
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-xl font-bold text-white" style={{ fontFamily: "Outfit, sans-serif" }}>Startup Roadmap</h1>
          <button onClick={generateNew} className="px-4 py-2 rounded-xl bg-[#9FFF00]/10 text-[#9FFF00] text-sm border border-[#9FFF00]/20 hover:bg-[#9FFF00]/20 transition-all cursor-pointer">
            Regenerate
          </button>
        </div>

        {summary && <p className="text-sm text-[#a1a1aa] mb-8">{summary}</p>}

        {/* Timeline */}
        <div className="relative pl-8 border-l-2 border-[#1a1a2e] space-y-10">
          {phases.map((phase, i) => (
            <div key={i} className="relative">
              {/* Dot */}
              <div className="absolute -left-[41px] w-4 h-4 rounded-full bg-[#9FFF00] border-4 border-[#0a0a0f]" />

              <div className="p-5 rounded-xl bg-[#18181b] border border-[#27272a]">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-base font-bold text-white">{phase.name}</h3>
                  <span className="text-xs px-2 py-0.5 rounded-lg bg-[#9FFF00]/10 text-[#9FFF00]">{phase.duration}</span>
                </div>
                <p className="text-sm text-[#a1a1aa] mb-4">{phase.objective}</p>

                <div className="space-y-2">
                  {phase.tasks.map((task, j) => (
                    <div key={j} className="flex items-center gap-3 text-sm">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        task.priority === "high" ? "bg-red-400" : task.priority === "medium" ? "bg-yellow-400" : "bg-blue-400"
                      }`} />
                      <span className="text-[#e4e4e7]">{task.title}</span>
                      <span className="text-[10px] text-[#71717a] ml-auto">{task.priority}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
