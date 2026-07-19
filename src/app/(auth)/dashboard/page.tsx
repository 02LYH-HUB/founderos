import { auth } from "@clerk/nextjs/server"
import Link from "next/link"
import { prisma } from "@/lib/db"
import QuickStartForm from "@/components/QuickStartForm"
import DailyBrief from "@/components/DailyBrief"
import PMTodoList from "@/components/PMTodoList"
import CEOInsights from "@/components/CEOInsights"

type Step = { num: number; icon: string; title: string; desc: string; href: string; done: boolean; why: string }

export default async function DashboardPage() {
  const { userId } = await auth()

  let projectName = "My Startup"
  const steps: Step[] = [
    { num: 1, icon: "💡", title: "Define Your Idea", desc: "Tell me what you're building", href: "/chat", done: false, why: "Before anything else, I need to understand your vision." },
    { num: 2, icon: "📊", title: "Market Research", desc: "Size your opportunity", href: "/research", done: false, why: "Let's find out if there's real demand for this." },
    { num: 3, icon: "🎯", title: "Business Model", desc: "How will you make money?", href: "/business-model", done: false, why: "Ideas are free. Revenue models aren't." },
    { num: 4, icon: "🗺️", title: "Startup Roadmap", desc: "Plan your first 3 months", href: "/roadmap", done: false, why: "Let's turn your vision into a concrete, week-by-week plan." },
    { num: 5, icon: "🤝", title: "AI Co-founder", desc: "Your daily partner in building", href: "/chat", done: false, why: "Once you're set up, I'll help you execute every day." },
  ]
  let memoryCount = 0, researchCount = 0, bmCount = 0, roadmapCount = 0
  let nextStepIdx = 0, isNew = true

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
          if (memoryCount > 0) steps[0].done = true
          if (researchCount > 0) steps[1].done = true
          if (bmCount > 0) steps[2].done = true
          if (roadmapCount > 0) steps[3].done = true
          if (memoryCount > 5 && bmCount > 0 && roadmapCount > 0) steps[4].done = true

          for (let i = 0; i < steps.length; i++) { if (!steps[i].done) { nextStepIdx = i; break } }
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
        {/* ── Daily Briefing ── */}
        <DailyBrief />

        {/* ── Quick Start Pipeline ── */}
        <QuickStartForm />

        {/* ── Hero Banner (new users) ── */}
        {isNew && (
          <div className="mb-10 p-6 rounded-2xl bg-gradient-to-br from-[#9FFF00]/10 to-[#9FFF00]/5 border border-[#9FFF00]/20">
            <div className="flex items-start gap-4">
              <div className="text-3xl">🚀</div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-white mb-1" style={{ fontFamily: "Outfit, sans-serif" }}>
                  Welcome to FounderOS, your AI co-founder!
                </h2>
                <p className="text-sm text-[#a1a1aa] mb-4">
                  I'll guide you through building {projectName} from idea to execution. Just 4 steps — let's start with the first one.
                </p>
                <Link
                  href={steps[nextStepIdx].href}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#9FFF00] text-[#0a0a0f] font-bold text-sm hover:bg-[#8ae600] transition-all cursor-pointer shadow-[0_4px_20px_rgba(159,255,0,0.2)] animate-pulse"
                >
                  {steps[nextStepIdx].icon} Start: {steps[nextStepIdx].title} →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ── Header ── */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-1" style={{ fontFamily: "Outfit, sans-serif" }}>{greeting} 👋</h1>
          <p className="text-sm text-[#a1a1aa]">
            {isNew ? "Let's build something great." : `${projectName} · ${memoryCount} memories · ${researchCount} reports`}
          </p>
        </div>

        {/* ── Progress Bar ── */}
        <div className="mb-8 p-5 rounded-2xl bg-[#18181b] border border-[#27272a]">
          <div className="flex items-center gap-2 mb-3">
            {steps.map((s, i) => (
              <div key={s.num} className="flex items-center gap-2 flex-1 last:flex-[0]">
                <div
                  className={`w-9 h-9 rounded-xl grid place-items-center text-sm font-bold transition-all ${
                    i === nextStepIdx && !s.done
                      ? "bg-[#9FFF00] text-[#0a0a0f] ring-2 ring-[#9FFF00]/40 scale-110"
                      : s.done ? "bg-[#9FFF00]/20 text-[#9FFF00]"
                      : "bg-[#27272a] text-[#71717a]"
                  }`}
                >
                  {s.done ? "✓" : s.num}
                </div>
                {i < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 rounded-full ${s.done ? "bg-[#9FFF00]/30" : "bg-[#27272a]"}`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between">
            {steps.map((s, i) => (
              <span key={s.num} className={`text-[10px] font-medium ${i === nextStepIdx && !s.done ? "text-[#9FFF00]" : s.done ? "text-[#9FFF00]/50" : "text-[#71717a]"}`}>
                {s.icon} {s.title}
              </span>
            ))}
          </div>
        </div>

        {/* ── Step Cards ── */}
        <div className="space-y-3">
          {steps.map((step, i) => {
            const isCurrent = i === nextStepIdx && !step.done
            const isNext = i > nextStepIdx && !step.done
            return (
              <Link
                key={step.num}
                href={step.href}
                className={`group block p-5 rounded-2xl border transition-all ${
                  step.done
                    ? "bg-[#18181b]/40 border-[#1a1a2e] opacity-50"
                    : isCurrent
                    ? "bg-[#9FFF00]/5 border-[#9FFF00]/30 hover:bg-[#9FFF00]/10 ring-1 ring-[#9FFF00]/10"
                    : "bg-[#18181b] border-[#27272a] hover:border-[#9FFF00]/20"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-xl grid place-items-center flex-shrink-0 font-bold transition-all ${
                      step.done ? "bg-[#27272a] text-[#71717a]"
                      : isCurrent ? "bg-[#9FFF00] text-[#0a0a0f] shadow-[0_0_20px_rgba(159,255,0,0.3)]"
                      : "bg-[#27272a] text-[#a1a1aa]"
                    }`}
                  >
                    {step.done ? "✓" : step.num}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className={`text-sm font-semibold ${step.done ? "text-[#71717a]" : isCurrent ? "text-white" : "text-[#a1a1aa]"}`}>
                        {step.icon} {step.title}
                      </h3>
                      {step.done && <span className="text-[10px] text-[#9FFF00]/40">Done</span>}
                      {isCurrent && (
                        <span className="text-[10px] text-[#9FFF00] px-2 py-0.5 bg-[#9FFF00]/10 rounded-lg font-bold animate-pulse">
                          Start here →
                        </span>
                      )}
                    </div>
                    <p className={`text-xs mt-1 ${step.done ? "text-[#71717a]/40" : isCurrent ? "text-[#9FFF00]/60" : "text-[#71717a]"}`}>
                      {step.why}
                    </p>
                  </div>
                  {!step.done && (
                    <span className={`text-sm ${isCurrent ? "text-[#9FFF00]" : "text-[#71717a]"} group-hover:translate-x-1 transition-transform`}>→</span>
                  )}
                </div>
              </Link>
            )
          })}
        </div>

        {/* ── Agent Panel ── */}
        <div className="mt-8 space-y-6">
          <CEOInsights />
          <PMTodoList />
        </div>

        {/* ── Stats (returning users) ── */}
        {!isNew && (
          <div className="mt-8 grid grid-cols-4 gap-4">
            {[
              { label: "Memories", value: memoryCount, icon: "🧠" },
              { label: "Reports", value: researchCount, icon: "📈" },
              { label: "Canvases", value: bmCount, icon: "🎯" },
              { label: "Roadmaps", value: roadmapCount, icon: "🗺️" },
            ].map((s) => (
              <div key={s.label} className="p-4 rounded-2xl bg-[#18181b] border border-[#27272a] text-center">
                <div className="text-lg mb-1">{s.icon}</div>
                <div className="text-xl font-bold text-white">{s.value}</div>
                <div className="text-[10px] text-[#71717a]">{s.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
