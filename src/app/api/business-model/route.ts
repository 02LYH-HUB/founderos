import { prisma } from "@/lib/db"
import { auth } from "@clerk/nextjs/server"
import { generateBusinessModel } from "@/lib/ai/bm-engine"

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

  const { industry, customerType, context } = await req.json()
  if (!industry || !customerType) return Response.json({ error: "Missing fields" }, { status: 400 })

  const project = await ensureProject(userId)

  try {
    const result = await generateBusinessModel({ industry, customerType, context })

    await prisma.businessModel.upsert({
      where: { projectId_version: { projectId: project.id, version: 1 } },
      create: { projectId: project.id, canvas: result.canvas as any, version: 1 },
      update: { canvas: result.canvas as any },
    })

    const summary = `## Summary\n${result.summary}\n\n## Key Metrics\n${
      Object.entries(result.metrics).map(([k, v]) => `- **${k}**: ${v}`).join("\n")
    }\n\n## Risks\n${result.risks.map((r: string) => `- ${r}`).join("\n")}\n\n## Next Steps\n${result.nextSteps.map((s: string) => `- ${s}`).join("\n")}`

    await prisma.memory.create({
      data: { projectId: project.id, type: "strategy", title: `商业模式: ${industry}`, content: summary, source: "auto", importance: 8 },
    })

    return Response.json(result)
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}

export async function GET(req: Request) {
  const { userId } = await auth()
  if (!userId) return Response.json({ canvas: null })

  const company = await prisma.company.findFirst({ where: { userId } })
  if (!company) return Response.json({ canvas: null })
  const project = await prisma.project.findFirst({ where: { companyId: company.id } })
  if (!project) return Response.json({ canvas: null })

  const bm = await prisma.businessModel.findFirst({
    where: { projectId: project.id }, orderBy: { createdAt: "desc" },
  })
  return Response.json(bm ? { canvas: bm.canvas as any, summary: "Generated", metrics: {}, risks: [], nextSteps: [] } : { canvas: null })
  }

  export async function PATCH(req: Request) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { canvas } = await req.json()
  if (!canvas) return Response.json({ error: "Missing canvas" }, { status: 400 })

  const company = await prisma.company.findFirst({ where: { userId } })
  if (!company) return Response.json({ error: "No project" }, { status: 404 })
  const project = await prisma.project.findFirst({ where: { companyId: company.id } })
  if (!project) return Response.json({ error: "No project" }, { status: 404 })

  await prisma.businessModel.upsert({
  where: { projectId_version: { projectId: project.id, version: 1 } },
  create: { projectId: project.id, canvas, version: 1 },
  update: { canvas },
  })

  return Response.json({ ok: true })
  }
