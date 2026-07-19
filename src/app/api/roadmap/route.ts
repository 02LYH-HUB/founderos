import { prisma } from "@/lib/db"
import { auth } from "@clerk/nextjs/server"
import { generateRoadmap } from "@/lib/ai/roadmap-engine"

async function ensureProject(userId: string) {
  let company = await prisma.company.findFirst({ where: { userId } })
  if (!company) company = await prisma.company.create({ data: { userId, name: "My Company" } })
  let project = await prisma.project.findFirst({ where: { companyId: company.id } })
  if (!project) project = await prisma.project.create({ data: { companyId: company.id, name: "My Startup", description: "My first project" } })
  return project
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { stage, timeline, context } = await req.json()
  if (!stage || !timeline) return Response.json({ error: "Missing fields" }, { status: 400 })

  const project = await ensureProject(userId)

  try {
    const result = await generateRoadmap({ stage, timeline, context })

    await prisma.roadmap.upsert({
      where: { projectId_version: { projectId: project.id, version: 1 } },
      create: { projectId: project.id, phases: result.phases as any, version: 1 },
      update: { phases: result.phases as any },
    })

    const summary = `## Summary\n${result.summary}\n\n## Risk Log\n${result.riskLog.map((r: any) => `- **${r.risk}** (${r.probability}/${r.impact}): ${r.mitigation}`).join("\n")}\n\n## Resources\n${result.resourcePlan.map((r: any) => `- ${r.role} — ${r.when}, ${r.cost}`).join("\n")}\n\n## Finance\n${result.financialProjection?.map((f: any) => `Month ${f.month}: burn ${f.burn}, revenue ${f.revenue} — ${f.milestone}`).join("\n") || ""}\n\n## Now\n${result.nextActions.map((a: string) => `- ${a}`).join("\n")}`

    await prisma.memory.create({
      data: { projectId: project.id, type: "strategy", title: `${timeline} 路线图`, content: summary, source: "auto", importance: 8 },
    })

    return Response.json(result)
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get("projectId")
  if (!projectId) return Response.json({ phases: null })
  const rd = await prisma.roadmap.findFirst({
    where: { projectId }, orderBy: { createdAt: "desc" },
  })
  return Response.json(rd ? { phases: rd.phases } : { phases: null })
}
