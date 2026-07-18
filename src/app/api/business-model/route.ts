import { prisma } from "@/lib/db"
import { auth } from "@clerk/nextjs/server"
import { generateBusinessModel } from "@/lib/ai/bm-engine"

async function getProjectId(userId: string) {
  const c = await prisma.company.findFirst({ where: { userId } })
  if (!c) return null
  const p = await prisma.project.findFirst({ where: { companyId: c.id } })
  return p?.id ?? null
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { industry, customerType } = await req.json()
  if (!industry || !customerType) return Response.json({ error: "Missing fields" }, { status: 400 })

  const projectId = await getProjectId(userId)
  if (!projectId) return Response.json({ error: "No project" }, { status: 404 })

  try {
    const result = await generateBusinessModel(industry, customerType)
    
    await prisma.businessModel.create({
      data: { projectId, canvas: result.canvas as any, version: 1 },
    })

    await prisma.memory.create({
      data: {
        projectId,
        type: "strategy",
        title: `${industry} · ${customerType} 商业模式`,
        content: result.summary,
        source: "auto",
        importance: 8,
      },
    })

    return Response.json({ summary: result.summary, canvas: result.canvas })
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
