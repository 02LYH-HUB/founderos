import { prisma } from "@/lib/db"
import { auth } from "@clerk/nextjs/server"

interface BriefItem {
  icon: string
  text: string
  action?: string
  href?: string
  done: boolean
}

async function ensureProject(userId: string) {
  let company = await prisma.company.findFirst({ where: { userId } })
  if (!company) company = await prisma.company.create({ data: { userId, name: "My Company" } })
  let project = await prisma.project.findFirst({ where: { companyId: company.id } })
  if (!project) project = await prisma.project.create({ data: { companyId: company.id, name: "My Startup", description: "My first project" } })
  return project
}

export async function GET() {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const project = await ensureProject(userId)
  const pid = project.id

  const [memories, researchCount, bmCount, roadmapCount, latestMemory, latestResearch, latestRoadmap] = await Promise.all([
    prisma.memory.count({ where: { projectId: pid } }),
    prisma.researchReport.count({ where: { projectId: pid } }),
    prisma.businessModel.count({ where: { projectId: pid } }),
    prisma.roadmap.count({ where: { projectId: pid } }),
    prisma.memory.findFirst({ where: { projectId: pid }, orderBy: { createdAt: "desc" } }),
    prisma.researchReport.findFirst({ where: { projectId: pid }, orderBy: { createdAt: "desc" } }),
    prisma.roadmap.findFirst({ where: { projectId: pid }, orderBy: { createdAt: "desc" } }),
  ])

  const items: BriefItem[] = []
  const isNew = memories === 0

  if (isNew) {
    items.push({ icon: "🚀", text: "Start your journey — tell me your idea and I'll generate a complete startup plan", action: "Generate Plan", href: "/dashboard", done: false })
    items.push({ icon: "💡", text: "Or pick a module: research your market, build a business model, or plan your roadmap", href: "/chat", done: false })
  } else {
    // Greeting with context
    const lastAction = latestMemory?.title || "worked on your project"
    items.push({ icon: "👋", text: `Welcome back! Last time you ${lastAction}.`, done: true })

    // What's missing
    if (researchCount === 0) items.push({ icon: "📊", text: "Research your market — understand your customers and competitors", action: "Research", href: "/research", done: false })
    else items.push({ icon: "📊", text: `You have ${researchCount} research report${researchCount > 1 ? "s" : ""}. Review or generate more.`, href: "/research", done: true })

    if (bmCount === 0) items.push({ icon: "🎯", text: "Build your business model canvas — 9 modules in one click", action: "Canvas", href: "/chat", done: false })
    else items.push({ icon: "🎯", text: "Business model canvas ready. Open it to review and refine.", href: "/business-model", done: true })

    if (roadmapCount === 0) items.push({ icon: "🗺️", text: "Create your startup roadmap — turn strategy into weekly tasks", action: "Roadmap", href: "/chat", done: false })
    else {
      const tasks = (latestRoadmap?.phases as any)?.[0]?.tasks || []
      const pending = tasks.length
      items.push({ icon: "🗺️", text: `Roadmap has ${pending} tasks in Phase 1. Ready to start executing?`, href: "/roadmap", done: false })
    }

    // Quick actions always present
    items.push({ icon: "⚡", text: "Quick actions: draft a pitch deck, write cold outreach, or brainstorm this week's priorities", href: "/chat", done: false })
  }

  return Response.json({ items, isNew, projectName: project.name })
}
