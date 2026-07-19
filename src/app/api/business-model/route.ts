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

  const { industry, customerType, context } = await req.json()
  if (!industry || !customerType) return Response.json({ error: "Missing fields" }, { status: 400 })

  const projectId = await getProjectId(userId)
  if (!projectId) return Response.json({ error: "No project" }, { status: 404 })

  try {
    const result = await generateBusinessModel({ industry, customerType, context })

    await prisma.businessModel.upsert({
      where: { projectId_version: { projectId, version: 1 } },
      create: { projectId, canvas: result.canvas as any, version: 1 },
      update: { canvas: result.canvas as any },
    })

    const summary = `## Summary\n${result.summary}\n\n## Key Metrics\n${
      Object.entries(result.metrics).map(([k, v]) => `- **${k}**: ${v}`).join("\n")
    }\n\n## Risks\n${result.risks.map((r: string) => `- ${r}`).join("\n")}\n\n## Next Steps\n${result.nextSteps.map((s: string) => `- ${s}`).join("\n")}`

    await prisma.memory.create({
      data: { projectId, type: "strategy", title: `商业模式: ${industry}`, content: summary, source: "auto", importance: 8 },
    })

    return Response.json(result)
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get("projectId")
  if (!projectId) return Response.json({ canvas: null })
  const bm = await prisma.businessModel.findFirst({
    where: { projectId }, orderBy: { createdAt: "desc" },
  })
  return Response.json(bm ? { canvas: bm.canvas as any, summary: "Generated", metrics: {}, risks: [], nextSteps: [] } : { canvas: null })
}
