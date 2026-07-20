import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db"
import QuickStartForm from "@/components/QuickStartForm"
import DailyBrief from "@/components/DailyBrief"
import PMTodoList from "@/components/PMTodoList"
import CEOInsights from "@/components/CEOInsights"

export default async function DashboardPage() {
  const { userId } = await auth()

  let projectName = "My Startup"
  let memoryCount = 0, researchCount = 0, bmCount = 0, roadmapCount = 0
  let isNew = true

  if (userId) {
    try {
      const company = await prisma.company.findFirst({ where: { userId } })
      if (company) {
        const project = await prisma.project.findFirst({ where: { companyId: company.id } })
        if (project) {
          projectName = project.name
          const counts = await Promise.all([
            prisma.memory.count({ where: { projectId: project.id } }),
            prisma.researchReport.count({ where: { projectId: project.id } }),
            prisma.businessModel.count({ where: { projectId: project.id } }),
            prisma.roadmap.count({ where: { projectId: project.id } }),
          ])
          memoryCount = counts[0]; researchCount = counts[1]; bmCount = counts[2]; roadmapCount = counts[3]
          isNew = memoryCount === 0 && researchCount === 0 && bmCount === 0 && roadmapCount === 0
        }
      }
    } catch {}
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"

  return (
    <div className="min-h-screen bg-[#0a0a0f] px-6 py-8 lg:px-12 lg:py-12">
      <div className="max-w-5xl mx-auto">
        {/* ── Greeting ── */}
        <h1 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: "Outfit, sans-serif" }}>{greeting} 👋</h1>
        <p className="text-sm text-[#a1a1aa] mb-8">{projectName}{!isNew && ` · ${memoryCount} memories · ${researchCount} reports · ${bmCount} canvases · ${roadmapCount} roadmaps`}</p>

        {/* ── Daily Briefing ── */}
        <DailyBrief />

        {/* ── Quick Start (new users) ── */}
        {isNew && <QuickStartForm />}

        {/* ── Agent Panel ── */}
        <div className="space-y-6">
          <CEOInsights />
          <PMTodoList />
        </div>
      </div>
    </div>
  )
}
