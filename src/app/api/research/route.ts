import { prisma } from "@/lib/db"
import { auth } from "@clerk/nextjs/server"
import { generateResearch } from "@/lib/ai/research-engine"

async function getProjectId(userId: string) {
  const company = await prisma.company.findFirst({ where: { userId } })
  if (!company) return null
  const project = await prisma.project.findFirst({ where: { companyId: company.id } })
  return project?.id ?? null
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 })

    const { topic } = await req.json()
    if (!topic) return Response.json({ error: "Missing topic" }, { status: 400 })

    const projectId = await getProjectId(userId)
    if (!projectId) return Response.json({ error: "No project found" }, { status: 404 })

    // Create report in DB (status: generating)
    const report = await prisma.researchReport.create({
      data: { projectId, topic, status: "generating", content: "" },
    })

    // Generate research
    const result = await generateResearch(topic)

    // Update report with results
    await prisma.researchReport.update({
      where: { id: report.id },
      data: {
        content: result.rawContent,
        summary: result.summary,
        sections: result.sections as any,
        status: "completed",
      },
    })

    // Auto-save to memory
    await prisma.memory.create({
      data: {
        projectId,
        type: "research",
        title: `${topic} — Research`,
        content: result.summary,
        source: "auto",
        importance: 7,
      },
    })

    return Response.json({
      report: {
        id: report.id,
        topic,
        summary: result.summary,
        sections: result.sections,
      },
    })
  } catch (error) {
    console.error("Research error:", error)
    return Response.json({ error: "Research generation failed" }, { status: 500 })
  }
}
