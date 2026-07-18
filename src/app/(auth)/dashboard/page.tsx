import { auth } from "@clerk/nextjs/server"
import Link from "next/link"
import { prisma } from "@/lib/db"

export default async function DashboardPage() {
  const { userId } = await auth()

  let stats = { memoryCount: 0, researchCount: 0, bmVersion: 0, roadmapVersion: 0 }
  let projectName = "My Startup"
  let recentTopics: string[] = []
  let hasHistory = false

  if (userId) {
    try {
      const company = await prisma.company.findFirst({ where: { userId } })
      if (company) {
        const project = await prisma.project.findFirst({ where: { companyId: company.id } })
        if (project) {
          projectName = project.name
          const [memoryCount, researchCount, bmCount, roadmapCount] = await Promise.all([
            prisma.memory.count({ where: { projectId: project.id } }),
            prisma.researchReport.count({ where: { projectId: project.id } }),
            prisma.businessModel.count({ where: { projectId: project.id } }),
            prisma.roadmap.count({ where: { projectId: project.id } }),
          ])
          stats = { memoryCount, researchCount, bmVersion: bmCount, roadmapVersion: roadmapCount }
          hasHistory = memoryCount > 0

          if (hasHistory) {
            const recent = await prisma.memory.findMany({
              where: { projectId: project.id },
              orderBy: { createdAt: "desc" },
              take: 3,
            })
            recentTopics = recent.map(m => m.title)
          }
        }
      }
    } catch {}
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"

  return (
    <div className="min-h-screen bg-[#0a0a0f] px-8 py-10">
      <div className="max-w-4xl">
        {/* Welcome Back */}
        <h1 className="text-3xl font-bold text-white mb-1" style={{ fontFamily: "Outfit, sans-serif" }}>
          {greeting} 👋
        </h1>
        <p className="text-[#a1a1aa] mb-8">
          Project: <span className="text-white font-medium">{projectName}</span>
        </p>

        {/* Progress Summary */}
        {hasHistory && (
          <div className="p-6 rounded-2xl bg-[#18181b] border border-[#27272a] mb-8">
            <h2 className="text-sm font-semibold text-[#a1a1aa] mb-3 uppercase tracking-wide">Today&apos;s Overview</h2>
            <div className="grid grid-cols-4 gap-4 mb-4">
              {[
                { label: "Memories", value: stats.memoryCount },
                { label: "Research", value: stats.researchCount },
                { label: "BM Canvas", value: stats.bmVersion },
                { label: "Roadmaps", value: stats.roadmapVersion },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <div className="text-2xl font-bold text-white mb-0.5">{s.value}</div>
                  <div className="text-[11px] text-[#71717a]">{s.label}</div>
                </div>
              ))}
            </div>
            <div className="text-sm text-[#71717a]">
              Recent: {recentTopics.slice(0, 2).join(" · ")}
            </div>
          </div>
        )}

        {/* New user guide */}
        {!hasHistory && (
          <div className="p-6 rounded-2xl bg-[#9FFF00]/5 border border-[#9FFF00]/10 mb-8">
            <h2 className="text-sm font-semibold text-[#9FFF00] mb-2">🚀 Let&apos;s get started</h2>
            <p className="text-sm text-[#a1a1aa]">
              Your AI co-founder is ready. Head to the Workbench to research your market, build a business model, or plan your roadmap.
            </p>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "AI Co-founder", desc: "Research, plan, execute", href: "/chat", icon: "💬" },
            { label: "Memory", desc: "Company knowledge", href: "/memory", icon: "🧠" },
            { label: "Research", desc: "Market analysis", href: "/research", icon: "📈" },
            { label: "Business Model", desc: "Generate canvas", href: "/business-model", icon: "🎯" },
          ].map((card) => (
            <Link
              key={card.label}
              href={card.href}
              className="p-5 rounded-2xl bg-[#18181b] border border-[#27272a] hover:border-[#9FFF00]/30 hover:bg-[#1a1a20] transition-all"
            >
              <div className="text-2xl mb-2">{card.icon}</div>
              <h3 className="text-sm font-semibold text-white mb-1">{card.label}</h3>
              <p className="text-xs text-[#71717a]">{card.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
