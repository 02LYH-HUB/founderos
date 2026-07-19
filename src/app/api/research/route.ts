import { prisma } from "@/lib/db"
import { auth } from "@clerk/nextjs/server"
import { generateResearch } from "@/lib/ai/research-engine"

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

  const { inputs, topic } = await req.json()
  if (!inputs?.problem && !topic) return Response.json({ error: "Missing inputs.problem" }, { status: 400 })
  const problem = inputs?.problem || topic

  const project = await ensureProject(userId)

  try {
    const result = await generateResearch({ ...inputs, problem })

    const summary = [
      `## Summary\n${result.summary}`,
      result.scores ? `\n## Scores\n${Object.entries(result.scores).map(([k,v]) => `- **${k}**: ${v}/10`).join("\n")}` : "",
      result.recommendation ? `\n## Recommendation\n${result.recommendation}` : "",
    ].join("\n")

    const fullContent = [
      summary,
      result.sections?.marketOverview ? `\n## 🌍 Market Overview\n${result.sections.marketOverview}` : "",
      result.sections?.competitorLandscape ? `\n## ⚔️ Competitor Landscape\n${result.sections.competitorLandscape}` : "",
      result.sections?.customerAnalysis ? `\n## 👤 Customer Analysis\n${result.sections.customerAnalysis}` : "",
      result.sections?.unitEconomics ? `\n## 💰 Unit Economics\n${result.sections.unitEconomics}` : "",
      result.sections?.goToMarket ? `\n## 🚀 Go-to-Market\n${result.sections.goToMarket}` : "",
      result.sections?.risksAndMitigation ? `\n## ⚠️ Risks\n${result.sections.risksAndMitigation}` : "",
      result.sections?.financialProjections ? `\n## 📈 Financial Projections\n${result.sections.financialProjections}` : "",
    ].join("\n")

    await prisma.researchReport.create({
      data: { projectId: project.id, topic: problem.slice(0, 200), summary: fullContent, content: fullContent, status: "completed" },
    })

    await prisma.memory.create({
      data: { projectId: project.id, type: "research", title: `市场研究: ${problem.slice(0, 60)}`, content: summary, source: "auto", importance: 7 },
    })

    return Response.json({
      report: { topic: problem.slice(0, 200), summary: fullContent, sections: result.sections, scores: result.scores, recommendation: result.recommendation },
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
