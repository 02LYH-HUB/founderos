"use client"

// Parses AI-generated markdown into structured sections for rendering

interface Section {
  emoji: string
  title: string
  body: string
}

function parseSections(md: string): Section[] {
  const sections: Section[] = []
  const lines = md.split("\n")
  let current: Section | null = null

  for (const line of lines) {
    const headingMatch = line.match(/^##\s+(.+)/)
    if (headingMatch) {
      if (current && current.body.trim()) sections.push(current)
      const title = headingMatch[1].replace(/^[📊🎯🗺️💡⚔️🌍💰📈⚠️🚀⚡✅👥]\s*/, "")
      const emoji = line.match(/^##\s+([📊🎯🗺️💡⚔️🌍💰📈⚠️🚀⚡✅👥])/)?.[1] || ""
      current = { emoji, title, body: "" }
    } else if (current) {
      current.body += (current.body ? "\n" : "") + line
    }
  }
  if (current && current.body.trim()) sections.push(current)
  return sections
}

export default function ReportRenderer({ content, suggestions }: { content: string; suggestions?: string[] }) {
  const sections = parseSections(content)

  return (
    <div className="space-y-4">
      {sections.map((sec, i) => {
        // Score section → render as bars
        if (sec.title.toLowerCase().includes("score") || sec.title.toLowerCase().includes("评分")) {
          const scores = sec.body.split("\n").filter(l => l.includes("/10") || l.includes("⭐"))
          return (
            <div key={i} className="p-5 rounded-2xl bg-[#18181b] border border-[#27272a]">
              <h3 className="text-sm font-bold text-[#a1a1aa] mb-3">
                {sec.emoji} {sec.title}
              </h3>
              <div className="space-y-2">
                {scores.map((s, j) => {
                  const match = s.match(/\*\*(.+?)\*\*.*?(\d+)\/10/)
                  if (!match) return null
                  const label = match[1]; const score = parseInt(match[2])
                  return (
                    <div key={j} className="flex items-center gap-3">
                      <span className="text-xs text-[#a1a1aa] w-32">{label}</span>
                      <div className="flex-1 h-2 bg-[#27272a] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-1000"
                          style={{
                            width: `${score * 10}%`,
                            background: score >= 7 ? "linear-gradient(90deg, #9FFF00, #7ad600)" : score >= 5 ? "linear-gradient(90deg, #f5a623, #e09100)" : "linear-gradient(90deg, #ef4444, #dc2626)",
                          }}
                        />
                      </div>
                      <span className="text-xs font-bold text-white w-8 text-right">{score}/10</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        }

        // Competitor section → table
        if (sec.title.toLowerCase().includes("competitor") || sec.title.toLowerCase().includes("竞品")) {
          return (
            <div key={i} className="p-5 rounded-2xl bg-[#18181b] border border-[#27272a]">
              <h3 className="text-sm font-bold text-[#a1a1aa] mb-3">
                {sec.emoji} {sec.title}
              </h3>
              <div className="text-sm text-[#e4e4e7] leading-relaxed whitespace-pre-wrap">
                {sec.body}
              </div>
            </div>
          )
        }

        // Default card
        return (
          <div key={i} className="p-5 rounded-2xl bg-[#18181b] border border-[#27272a]">
            <h3 className="text-sm font-bold text-[#a1a1aa] mb-3">
              {sec.emoji} {sec.title}
            </h3>
            <div className="text-sm text-[#e4e4e7] leading-relaxed whitespace-pre-wrap">
              {sec.body}
            </div>
          </div>
        )
      })}

      {/* Proactive next-step suggestions */}
      {suggestions && suggestions.length > 0 && (
        <div className="mt-6 p-5 rounded-2xl bg-[#9FFF00]/5 border border-[#9FFF00]/20">
          <h3 className="text-sm font-bold text-[#9FFF00] mb-3">💡 Recommended next steps</h3>
          <div className="space-y-2">
            {suggestions.map((s, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-[#a1a1aa]">
                <span className="text-[#9FFF00] mt-0.5">{i + 1}.</span>
                <span>{s}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
