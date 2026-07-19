"use client"

import { useState, useEffect } from "react"

const MODULES = [
  "customerSegments", "valuePropositions", "channels",
  "customerRelationships", "revenueStreams", "keyResources",
  "keyActivities", "keyPartnerships", "costStructure",
] as const

const LABELS: Record<string, string> = {
  customerSegments: "Customer Segments",
  valuePropositions: "Value Propositions",
  channels: "Channels",
  customerRelationships: "Customer Relationships",
  revenueStreams: "Revenue Streams",
  keyResources: "Key Resources",
  keyActivities: "Key Activities",
  keyPartnerships: "Key Partnerships",
  costStructure: "Cost Structure",
}

type Canvas = Record<string, string>

export default function BMPage() {
  const [projectId, setProjectId] = useState<string | null>(null)
  const [canvas, setCanvas] = useState<Canvas | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/dashboard")
      .then(async r => { try { return await r.json() } catch { return {} } })
      .then(d => { if (d.project?.id) { setProjectId(d.project.id); loadCanvas(d.project.id) } })
      .finally(() => setLoading(false))
  }, [])

  function loadCanvas(pid: string) {
    fetch(`/api/business-model?projectId=${pid}`)
      .then(r => r.json())
      .then(d => { if (d.canvas) setCanvas(d.canvas) })
      .catch(() => {})
  }

  function startEdit(key: string) {
    setEditing(key)
    setEditValue(canvas?.[key] || "")
  }

  function saveEdit(key: string) {
    if (!canvas || !editValue.trim()) { setEditing(null); return }
    const updated = { ...canvas, [key]: editValue.trim() }
    setCanvas(updated)
    setEditing(null)
  }

  async function generateNew() {
    if (!projectId) return
    setLoading(true)
    try {
      const r = await fetch("/api/business-model", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ industry: "Technology", customerType: "B2C" }),
      })
      const d = await r.json()
      if (d.canvas) setCanvas(d.canvas)
    } catch {}
    setLoading(false)
  }

  if (loading) return <div className="p-8 text-[#a1a1aa]">Loading...</div>

  if (!canvas) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0a0a0f]">
        <div className="text-center">
          <div className="text-5xl mb-4">🎯</div>
          <h2 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>No Canvas Yet</h2>
          <p className="text-sm text-[#71717a] mb-6">Generate your first business model canvas</p>
          <button onClick={generateNew} className="px-6 py-3 rounded-xl bg-[#9FFF00] text-[#0a0a0f] font-bold text-sm hover:bg-[#8ae600] transition-all cursor-pointer">
            Generate Canvas
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-xl font-bold text-white" style={{ fontFamily: "Outfit, sans-serif" }}>Business Model Canvas</h1>
          <button onClick={generateNew} className="px-4 py-2 rounded-xl bg-[#9FFF00]/10 text-[#9FFF00] text-sm border border-[#9FFF00]/20 hover:bg-[#9FFF00]/20 transition-all cursor-pointer">
            Regenerate
          </button>
        </div>

        {/* 3x3 Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {MODULES.map(key => (
            <div
              key={key}
              className="p-5 rounded-xl bg-[#18181b] border border-[#27272a] hover:border-[#9FFF00]/20 transition-all group cursor-pointer min-h-[140px]"
              onClick={() => startEdit(key)}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-[#a1a1aa] tracking-wide uppercase">{LABELS[key]}</h3>
                <span className="text-[10px] text-[#71717a] opacity-0 group-hover:opacity-100 transition-opacity">Edit</span>
              </div>
              {editing === key ? (
                <div onClick={e => e.stopPropagation()}>
                  <textarea
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    className="w-full bg-[#0a0a0f] border border-[#9FFF00]/30 rounded-lg px-3 py-2 text-sm text-white resize-none focus:outline-none"
                    rows={3}
                    autoFocus
                  />
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => saveEdit(key)} className="text-xs px-3 py-1.5 rounded-lg bg-[#9FFF00] text-[#0a0a0f] font-semibold cursor-pointer">Save</button>
                    <button onClick={() => setEditing(null)} className="text-xs px-3 py-1.5 rounded-lg bg-[#27272a] text-[#a1a1aa] cursor-pointer">Cancel</button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-[#e4e4e7] leading-relaxed line-clamp-4">{canvas[key] || "—"}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
