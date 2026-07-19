import { auth } from "@clerk/nextjs/server"
import Link from "next/link"
import { prisma } from "@/lib/db"

type Step = { num: number; title: string; desc: string; href: string; done: boolean }

export default async function DashboardPage() {
  const { userId } = await auth()

  let projectName = "My Startup"
  let projectId = ""
  const steps: Step[] = [
    { num: 1, title: "Define Your Idea", desc: "Tell your AI co-founder what you're building", href: "/chat", done: false },
    { num: 2, title: "Market Research", desc: "Validate your market with real-time data", href: "/research", done: false },
    { num: 3, title: "Business Model", desc: "Generate your 9-module canvas", href: "/business-model", done: false },
    { num: 4, title: "Startup Roadmap", desc: "Plan your first 3 months", href: "/roadmap", done: false },
    { num: 5, title: "AI Co-founder", desc: "Your daily strategic partner", href: "/chat", done: false },
  ]
  let memoryCount = 0, researchCount = 0, bmCount = 0, roadmapCount = 0
  let nextRecommendation = ""

  if (userId) {
    try {
      const company = await prisma.company.findFirst({ where: { userId } })
      if (company) {
        const project = await prisma.project.findFirst({ where: { companyId: company.id } })
        if (project) {
          projectName = project.name
          projectId = project.id
          const counts = await Promise.all([
            prisma.memory.count({ where: { projectId: project.id } }),
            prisma.researchReport.count({ where: { projectId: project.id } }),
            prisma.businessModel.count({ where: { projectId: project.id } }),
            prisma.roadmap.count({ where: { projectId: project.id } }),
          ])
          memoryCount = counts[0]; researchCount = counts[1]; bmCount = counts[2]; roadmapCount = counts[3]

          // Determine which steps are done
          if (memoryCount > 0) steps[0].done = true
          if (researchCount > 0) steps[1].done = true
          if (bmCount > 0) steps[2].done = true
          if (roadmapCount > 0) steps[3].done = true
          if (memoryCount > 5 && bmCount > 0 && roadmapCount > 0) steps[4].done = true

          // Next recommendation
          if (researchCount === 0) nextRecommendation = "research"
          else if (bmCount === 0) nextRecommendation = "bm"
          else if (roadmapCount === 0) nextRecommendation = "roadmap"
          else nextRecommendation = "chat"
        }
      }
    } catch {}
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"
  const isNew = memoryCount === 0 && researchCount === 0 && bmCount === 0 && roadmapCount === 0

  return (
    <div className="min-h-screen bg-[#0a0a0f] px-6 py-8 lg:px-12 lg:py-12">
      <div className="max-w-5xl mx-auto">
        {/* ── Header ── */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>
            {greeting} 👋
          </h1>
          <p className="text-[#a1a1aa] text-sm">
            {isNew
              ? `Welcome to FounderOS. I'm your AI co-founder — let's build ${projectName} from 0 to 1.`
              : `${projectName} · ${memoryCount} memories · ${researchCount} reports · ${bmCount} canvases · ${roadmapCount} roadmaps`}
          </p>
        </div>

        {/* ── Progress Bar ── */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            {steps.map((s, i) => (
              <div key={s.num} className="flex items-center gap-2 flex-1 last:flex-[0]">
                <div
                  className={`w-8 h-8 rounded-xl grid place-items-center text-xs font-bold transition-all ${
                    s.done ? "bg-[#9FFF00] text-[#0a0a0f]" : "bg-[#27272a] text-[#71717a]"
                  }`}
                >
                  {s.done ? "✓" : s.num}
                </div>
                {i < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 rounded-full ${s.done ? "bg-[#9FFF00]/40" : "bg-[#27272a]"}`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between">
            {steps.map((s) => (
              <span key={s.num} className={`text-[10px] ${s.done ? "text-[#9FFF00]" : "text-[#71717a]"}`}>
                {s.title}
              </span>
            ))}
          </div>
        </div>

        {/* ── Step Cards ── */}
        <div className="space-y-3">
          {steps.map((step) => {
            const isNext = step.href.includes(nextRecommendation) && !step.done
            const isChat = step.href === "/chat" && step.num === 5
            return (
              <Link
                key={step.num}
                href={step.href}
                className={`group flex items-center gap-4 p-5 rounded-2xl border transition-all cursor-pointer ${
                  step.done
                    ? "bg-[#18181b]/50 border-[#1a1a2e] opacity-40"
                    : isNext || isChat
                    ? "bg-[#9FFF00]/5 border-[#9FFF00]/20 hover:border-[#9FFF00]/40 hover:bg-[#9FFF00]/10"
                    : "bg-[#18181b] border-[#27272a] opacity-60"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl grid place-items-center text-sm font-bold flex-shrink-0 transition-all ${
                    step.done
                      ? "bg-[#9FFF00]/10 text-[#9FFF00]/40"
                      : isNext || isChat
                      ? "bg-[#9FFF00] text-[#0a0a0f]"
                      : "bg-[#27272a] text-[#71717a]"
                  }`}
                >
                  {step.done ? "✓" : step.num}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3
                      className={`text-sm font-semibold ${
                        step.done ? "text-[#71717a]" : isNext || isChat ? "text-white" : "text-[#71717a]"
                      }`}
                    >
                      {step.title}
                    </h3>
                    {step.done && <span className="text-[10px] text-[#9FFF00]/50">Done</span>}
                    {isNext && !step.done && <span className="text-[10px] text-[#9FFF00] px-2 py-0.5 bg-[#9FFF00]/10 rounded-lg">Next →</span>}
                    {isChat && !step.done && <span className="text-[10px] text-[#9FFF00] px-2 py-0.5 bg-[#9FFF00]/10 rounded-lg">Open</span>}
                  </div>
                  <p className={`text-xs mt-0.5 ${step.done ? "text-[#71717a]/50" : "text-[#71717a]"}`}>{step.desc}</p>
                </div>
                <span className={`text-[#71717a] text-sm group-hover:translate-x-1 transition-transform ${
                  step.done ? "hidden" : ""
                }`}>
                  →
                </span>
              </Link>
            )
          })}
        </div>

        {/* ── Stats (only for returning users) ── */}
        {!isNew && (
          <div className="mt-10 p-5 rounded-2xl bg-[#18181b] border border-[#27272a]">
            <h2 className="text-xs font-semibold text-[#71717a] mb-3 uppercase tracking-wide">Project Health</h2>
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: "Memories", value: memoryCount, icon: "🧠" },
                { label: "Reports", value: researchCount, icon: "📈" },
                { label: "Canvases", value: bmCount, icon: "🎯" },
                { label: "Roadmaps", value: roadmapCount, icon: "🗺️" },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <div className="text-lg mb-0.5">{s.icon}</div>
                  <div className="text-xl font-bold text-white">{s.value}</div>
                  <div className="text-[10px] text-[#71717a]">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
