import { auth } from "@clerk/nextjs/server"
import Link from "next/link"
import { prisma } from "@/lib/db"

export default async function DashboardPage() {
  const { userId } = await auth()

  let stats = { memoryCount: 0, researchCount: 0, bmVersion: 0 }
  let projectName = "My Startup"

  if (userId) {
    try {
      const company = await prisma.company.findFirst({ where: { userId } })
      if (company) {
        const project = await prisma.project.findFirst({ where: { companyId: company.id } })
        if (project) {
          projectName = project.name
          const [memoryCount, researchCount, bmCount] = await Promise.all([
            prisma.memory.count({ where: { projectId: project.id } }),
            prisma.researchReport.count({ where: { projectId: project.id } }),
            prisma.businessModel.count({ where: { projectId: project.id } }),
          ])
          stats = { memoryCount, researchCount, bmVersion: bmCount }
        }
      }
    } catch {}
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] px-8 py-10">
      <div className="max-w-4xl">
        <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>
          Dashboard
        </h1>
        <p className="text-[#a1a1aa] mb-10">
          Project: <span className="text-white font-medium">{projectName}</span>
        </p>

        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { label: "Memories", value: stats.memoryCount },
            { label: "Research", value: stats.researchCount },
            { label: "BM Versions", value: stats.bmVersion },
          ].map((s) => (
            <div key={s.label} className="p-5 rounded-2xl bg-[#18181b] border border-[#27272a]">
              <div className="text-3xl font-bold text-white mb-1">{s.value}</div>
              <div className="text-sm text-[#71717a]">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Founder Chat", desc: "Talk to your AI co-founder", href: "/chat", icon: "💬" },
            { label: "Business Memory", desc: "Company knowledge", href: "/memory", icon: "🧠" },
            { label: "Market Research", desc: "Analyze markets", href: "/research", icon: "📈" },
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
