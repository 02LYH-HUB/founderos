import { prisma } from "@/lib/db"
import { auth } from "@clerk/nextjs/server"
import { generateRoadmap } from "@/lib/ai/roadmap-engine"

async function getProjectId(userId: string) {
  const c = await prisma.company.findFirst({ where: { userId } })
  if (!c) return null
  const p = await prisma.project.findFirst({ where: { companyId: c.id } })
  return p?.id ?? null
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { stage, timeline } = await req.json()
  if (!stage || !timeline) return Response.json({ error: "Missing fields" }, { status: 400 })

  const projectId = await getProjectId(userId)
  if (!projectId) return Response.json({ error: "No project" }, { status: 404 })

  try {
    const result = await generateRoadmap(stage, timeline)
    
    await prisma.roadmap.create({
      data: { projectId, phases: result.phases as any, version: 1 },
    })

    await prisma.memory.create({
      data: {
        projectId,
        type: "strategy",
        title: `${timeline} 启动路线图`,
        content: result.summary,
        source: "auto",
        importance: 8,
      },
    })

    return Response.json(result)
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
