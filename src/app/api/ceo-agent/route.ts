/**
 * AI CEO Agent — Strategic advisor that analyzes project state
 * and provides personalized, actionable recommendations.
 */

import { prisma } from "@/lib/db"
import { auth } from "@clerk/nextjs/server"
import { searchMemories } from "@/lib/rag/retrieve"

const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY!

interface CEOInsight {
  type: "action" | "warning" | "insight" | "idea"
  title: string
  detail: string
  action?: { label: string; href: string }
}

export async function GET() {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const company = await prisma.company.findFirst({ where: { userId } })
  if (!company) return Response.json({ insights: [], summary: "No company found" })
  const project = await prisma.project.findFirst({ where: { companyId: company.id } })
  if (!project) return Response.json({ insights: [], summary: "No project found" })

  const pid = project.id

  // Gather project state
  const [memories, reports, bmCount, roadmapCount, latestReport, latestRoadmap] = await Promise.all([
    prisma.memory.count({ where: { projectId: pid } }),
    prisma.researchReport.count({ where: { projectId: pid } }),
    prisma.businessModel.count({ where: { projectId: pid } }),
    prisma.roadmap.count({ where: { projectId: pid } }),
    prisma.researchReport.findFirst({ where: { projectId: pid }, orderBy: { createdAt: "desc" } }),
    prisma.roadmap.findFirst({ where: { projectId: pid }, orderBy: { createdAt: "desc" } }),
  ])

  // Get relevant memories for context
  const latestMemories = await searchMemories(pid, "strategy progress goals", 5)

  const context = {
    projectName: project.name,
    stats: { memories, reports, bmCount, roadmapCount },
    latestReport: latestReport?.summary?.slice(0, 500) || "None",
    roadmapPhases: (latestRoadmap?.phases as any)?.length || 0,
    recentTopics: latestMemories.map(m => m.title).slice(0, 3),
  }

  const prompt = `You are the CEO Agent of FounderOS — an AI co-founder for a solo entrepreneur. Analyze the project and give STRATEGIC recommendations.

## Project State
- Name: ${context.projectName}
- Stats: ${JSON.stringify(context.stats)}
- Latest research: ${context.latestReport}
- Roadmap phases: ${context.roadmapPhases}
- Recent topics: ${context.recentTopics.join(", ")}

## Instructions
Return JSON with:
{
  "summary": "One personalized sentence about the project state",
  "insights": [
    {
      "type": "action" | "warning" | "insight" | "idea",
      "title": "Short actionable title",
      "detail": "One sentence explanation with specific numbers or reasoning",
      "action": { "label": "What to click", "href": "/path" } // only for type "action"
    }
  ]
}

Rules:
- Generate 3-5 insights maximum
- Be SPECIFIC and PERSONAL to this project. No generic advice.
- If research exists but no BM, suggest generating BM canvas
- If roadmap exists, suggest executing Phase 1 tasks
- If nothing done yet, suggest using QuickStart pipeline
- Types: "action" = clickable task, "warning" = risk/reminder, "insight" = observation, "idea" = creative suggestion`

  try {
    const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${DEEPSEEK_KEY}` },
      body: JSON.stringify({ model: "deepseek-chat", messages: [{ role: "user", content: prompt }], temperature: 0.3, max_tokens: 1000, response_format: { type: "json_object" } }),
    })
    const data = (await res.json()) as { choices: [{ message: { content: string } }] }
    const json = JSON.parse(data.choices[0].message.content)
    return Response.json({ summary: json.summary, insights: json.insights || [] })
  } catch (e: any) {
    return Response.json({ insights: [], summary: "Analyzing your project..." })
  }
}
