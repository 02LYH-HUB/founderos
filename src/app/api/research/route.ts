import { prisma } from "@/lib/db"
import { auth } from "@clerk/nextjs/server"
import { generateResearch } from "@/lib/ai/research-engine"

async function getProjectId(userId: string) {
  const c = await prisma.company.findFirst({ where: { userId } })
  if (!c) return null
  const p = await prisma.project.findFirst({ where: { companyId: c.id } })
  return p?.id ?? null
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { topic, context } = await req.json()
  if (!topic && !context) return Response.json({ error: "Missing topic or context" }, { status: 400 })

  const projectId = await getProjectId(userId)
  if (!projectId) return Response.json({ error: "No project" }, { status: 404 })

  try {
    // Parse context string (from interview answers) or use topic directly
    let input: Parameters<typeof generateResearch>[0]
    if (context && typeof context === "string") {
      const lines = context.split("\n").filter(Boolean)
      input = {
        problem: lines[1]?.replace("A: ", "") || topic,
        who: lines[3]?.replace("A: ", "") || "",
        currentSolutions: lines[5]?.replace("A: ", "") || "",
        marketSize: lines[7]?.replace("A: ", "") || "",
        advantage: lines[9]?.replace("A: ", "") || "",
      }
    } else {
      input = {
        problem: topic,
        who: "",
        currentSolutions: "",
        marketSize: "",
        advantage: "",
      }
    }

    const result = await generateResearch(input)

    const summary = `## Summary\n${result.summary}\n\n## Scores\n${Object.entries(result.scores).map(([k,v]) => `- **${k}**: ${v}/10`).join("\n")}\n\n## Recommendation\n${result.recommendation}`

    await prisma.researchReport.create({
      data: { projectId, topic: input.problem.slice(0, 200), summary, content: summary, status: "completed" },
    })

    await prisma.memory.create({
      data: {
        projectId, type: "research",
        title: `市场研究: ${input.problem.slice(0, 60)}`,
        content: summary, source: "auto", importance: 7,
      },
    })

    return Response.json({
      report: {
        topic: input.problem.slice(0, 200),
        summary,
        sections: result.sections,
        scores: result.scores,
        recommendation: result.recommendation,
      },
    })
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get("projectId")
  if (!projectId) return Response.json({ reports: [] })
  const reports = await prisma.researchReport.findMany({
    where: { projectId }, orderBy: { createdAt: "desc" }, take: 50,
  })
  return Response.json({ reports })
}
