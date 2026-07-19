"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

interface Insight {
  type: "action" | "warning" | "insight" | "idea"
  title: string
  detail: string
  action?: { label: string; href: string }
}

export default function CEOInsights() {
  const [summary, setSummary] = useState("")
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/ceo-agent")
      .then(async r => { try { return await r.json() } catch { return {} } })
      .then(d => { setSummary(d.summary || ""); setInsights(d.insights || []) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-sm text-[#71717a] animate-pulse">CEO analyzing...</div>

  if (insights.length === 0) return null

  const typeColors: Record<string, string> = {
    action: "border-[#9FFF00]/30 bg-[#9FFF00]/5",
    warning: "border-yellow-500/20 bg-yellow-500/5",
    insight: "border-blue-400/20 bg-blue-400/5",
    idea: "border-purple-400/20 bg-purple-400/5",
  }

  const typeEmojis: Record<string, string> = {
    action: "▶️", warning: "⚠️", insight: "💡", idea: "✨",
  }

  return (
    <div className="p-6 rounded-2xl bg-gradient-to-br from-[#18181b] to-[#1a1a20] border border-[#27272a]">
      <div className="flex items-center gap-2 mb-5">
        <span className="text-lg">🤖</span>
        <h2 className="text-sm font-bold text-white">AI CEO Insights</h2>
      </div>

      {summary && <p className="text-sm text-[#a1a1aa] mb-4 leading-relaxed">{summary}</p>}

      <div className="space-y-3">
        {insights.map((insight, i) => (
          <div key={i} className={`p-4 rounded-xl border ${typeColors[insight.type] || "border-[#27272a]"}`}>
            <div className="flex items-start gap-2 mb-1">
              <span className="text-sm mt-0.5">{typeEmojis[insight.type] || "•"}</span>
              <p className="text-sm text-white font-medium">{insight.title}</p>
            </div>
            <p className="text-xs text-[#a1a1aa] ml-6">{insight.detail}</p>
            {insight.action && (
              <Link href={insight.action.href}
                className="inline-block ml-6 mt-2 text-xs font-bold text-[#9FFF00] hover:text-[#b8ff33] transition-colors">
                {insight.action.label} →
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
