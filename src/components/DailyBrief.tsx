"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

interface BriefItem {
  icon: string; text: string; action?: string; href?: string; done: boolean
}

export default function DailyBrief() {
  const [items, setItems] = useState<BriefItem[]>([])
  const [projectName, setProjectName] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/daily-brief")
      .then(async r => { try { return await r.json() } catch { return {} } })
      .then(d => { setItems(d.items || []); setProjectName(d.projectName || "") })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-sm text-[#71717a] animate-pulse">Loading your briefing...</div>

  const doneCount = items.filter(i => i.done).length
  const progress = items.length > 0 ? Math.round((doneCount / items.length) * 100) : 0

  return (
    <div className="mb-10 p-6 rounded-2xl bg-gradient-to-br from-[#18181b] to-[#1a1a20] border border-[#27272a]">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-white flex items-center gap-2" style={{ fontFamily: "Outfit, sans-serif" }}>
          ☀️ Daily Briefing
        </h2>
        <span className="text-xs text-[#71717a]">{projectName} · {progress}% complete</span>
      </div>

      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className={`flex items-start gap-3 p-3 rounded-xl transition-all ${
            item.done ? "bg-[#18181b]/50" : item.action ? "bg-[#9FFF00]/5 border border-[#9FFF00]/10" : "bg-[#18181b]/50"
          }`}>
            <div className={`w-8 h-8 rounded-lg grid place-items-center flex-shrink-0 text-sm ${
              item.done ? "bg-[#27272a] text-[#71717a]" : "bg-[#9FFF00]/10 text-[#9FFF00]"
            }`}>
              {item.done ? "✓" : item.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${item.done ? "text-[#71717a]" : "text-[#e4e4e7]"}`}>{item.text}</p>
              {item.action && item.href && (
                <Link href={item.href} className="inline-block mt-1 text-xs font-bold text-[#9FFF00] hover:text-[#b8ff33] transition-colors">
                  {item.action} →
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Quick progress bar */}
      <div className="mt-5 h-1.5 bg-[#27272a] rounded-full overflow-hidden">
        <div className="h-full bg-[#9FFF00] rounded-full transition-all duration-1000" style={{ width: `${progress}%` }} />
      </div>
    </div>
  )
}
