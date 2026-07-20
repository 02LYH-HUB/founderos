"use client"

import { useState, useEffect } from "react"

type Memory = { id: string; type: string; title: string; content: string; importance: number; source: string; createdAt: string }
type Project = { id: string }

export default function MemoryPage() {
  const [projectId, setProjectId] = useState<string | null>(null)
  const [memories, setMemories] = useState<Memory[]>([])
  const [selected, setSelected] = useState<Memory | null>(null)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [loading, setLoading] = useState(true)

  const TYPES = ["all", "idea", "research", "strategy", "decision", "note", "feedback", "competitor", "goal"]

  function loadMemories(pid: string, q?: string) {
    setLoading(true)
    const params = new URLSearchParams({ projectId: pid })
    if (q) params.set("q", q)
    fetch(`/api/memory?${params}`)
      .then(r => r.json())
      .then(d => { setMemories(d.memories || []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  async function deleteMemory(id: string) {
    await fetch(`/api/memory?id=${id}`, { method: "DELETE" })
    setMemories(prev => prev.filter(m => m.id !== id))
    if (selected?.id === id) setSelected(null)
  }

  useEffect(() => {
    fetch("/api/dashboard")
      .then(async r => { try { return await r.json() } catch { return {} } })
      .then(d => {
        if (d.project?.id) { setProjectId(d.project.id); loadMemories(d.project.id) }
        else setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!projectId) return
    loadMemories(projectId, search)
  }, [projectId, search])

  const filtered = typeFilter === "all" ? memories : memories.filter(m => m.type === typeFilter)

  if (!projectId) return <div className="p-8 text-[#a1a1aa]">Loading...</div>

  return (
    <div className="flex h-screen bg-[#0a0a0f]">
      {/* List */}
      <div className={`flex flex-col ${selected ? "hidden md:flex md:w-80" : "flex-1"} border-r border-[#1a1a2e]`}>
        <div className="px-5 py-4 border-b border-[#1a1a2e]">
          <h1 className="text-lg font-semibold text-white mb-3" style={{ fontFamily: "Outfit, sans-serif" }}>Memory</h1>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search memories..."
            className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-3 py-2 text-sm text-white placeholder:text-[#71717a] focus:outline-none focus:border-[#9FFF00]/50"
          />
          <div className="flex gap-1 mt-2 flex-wrap">
            {TYPES.map(t => (
              <button key={t} onClick={() => setTypeFilter(t)}
                className={`text-[11px] px-2 py-1 rounded-lg transition-all cursor-pointer ${
                  typeFilter === t ? "bg-[#9FFF00]/15 text-[#9FFF00]" : "text-[#71717a] hover:text-white"
                }`}
              >{t}</button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading && <div className="p-5 text-sm text-[#71717a]">Loading...</div>}
          {!loading && filtered.length === 0 && (
            <div className="p-8 text-center text-sm text-[#71717a]">
              🧠 Memories will auto-populate as you generate plans. Go to Dashboard → input your idea → Generate Plan to see your first memory.
            </div>
          )}
          {filtered.map(m => (
            <button key={m.id} onClick={() => setSelected(m)}
              className={`w-full text-left p-4 border-b border-[#1a1a2e] hover:bg-[#18181b] transition-all cursor-pointer ${
                selected?.id === m.id ? "bg-[#18181b] border-l-2 border-l-[#9FFF00]" : ""
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] px-2 py-0.5 rounded-lg bg-[#27272a] text-[#a1a1aa]">{m.type}</span>
                <span className="text-[10px] text-[#71717a]">{new Date(m.createdAt).toLocaleDateString()}</span>
              </div>
              <h3 className="text-sm font-medium text-white truncate">{m.title}</h3>
              <p className="text-xs text-[#71717a] truncate mt-0.5">{m.content.slice(0, 80)}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Detail */}
      {selected && (
        <div className="flex-1 p-8 overflow-y-auto">
          <button onClick={() => setSelected(null)} className="md:hidden text-sm text-[#71717a] mb-4">← Back</button>
          <div className="mb-4 flex items-center gap-3">
            <span className="text-xs px-3 py-1 rounded-xl bg-[#9FFF00]/15 text-[#9FFF00] font-medium">{selected.type}</span>
            <span className="text-xs text-[#71717a]">{new Date(selected.createdAt).toLocaleString()}</span>
            <span className="text-xs text-[#71717a]">· {selected.source}</span>
            <span className="text-xs text-[#71717a]">· ⭐{"⭐".repeat(Math.min(selected.importance, 5))}</span>
            <button
              onClick={() => deleteMemory(selected.id)}
              className="ml-auto text-xs px-3 py-1 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all cursor-pointer"
            >🗑 Delete</button>
          </div>
          <h2 className="text-xl font-bold text-white mb-4" style={{ fontFamily: "Outfit, sans-serif" }}>{selected.title}</h2>
          <div className="text-sm text-[#a1a1aa] leading-relaxed whitespace-pre-wrap">{selected.content}</div>
        </div>
      )}

      {!selected && (
        <div className="hidden md:flex flex-1 items-center justify-center text-sm text-[#71717a]">
          Select a memory to view details
        </div>
      )}
    </div>
  )
}
