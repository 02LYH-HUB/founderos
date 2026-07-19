/**
 * Pipeline API — One-click startup plan generator
 * Flow: Idea → Research → Business Model → Roadmap → Complete Plan
 */

import { prisma } from "@/lib/db"
import { auth } from "@clerk/nextjs/server"
import { generateResearch } from "@/lib/ai/research-engine"
import { generateBusinessModel } from "@/lib/ai/bm-engine"
import { generateRoadmap } from "@/lib/ai/roadmap-engine"

const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY!

async function ensureProject(userId: string) {
  let company = await prisma.company.findFirst({ where: { userId } })
  if (!company) company = await prisma.company.create({ data: { userId, name: "My Company" } })
  let project = await prisma.project.findFirst({ where: { companyId: company.id } })
  if (!project) project = await prisma.project.create({ data: { companyId: company.id, name: "My Startup", description: "My first project" } })
  return project
}

/** Extract structured research inputs from user's free-form idea */
async function extractIdea(idea: string): Promise<{
  problem: string; who: string; currentSolutions: string; marketSize: string; advantage: string
}> {
  const prompt = `Analyze this startup idea and extract key information for market research. Return ONLY JSON.

User's idea: "${idea}"

{
  "problem": "What specific problem does this solve? (one sentence)",
  "who": "Who is the target customer? (age, role, behavior)",
  "currentSolutions": "How do people solve this today? (existing tools or manual methods)",
  "marketSize": "Estimated market size category: niche (<$100M) / growing ($100M-$1B) / massive (>$1B)",
  "advantage": "What's the unique angle or competitive advantage?"
}`

  const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${DEEPSEEK_KEY}` },
    body: JSON.stringify({ model: "deepseek-chat", messages: [{ role: "user", content: prompt }], temperature: 0.3, response_format: { type: "json_object" } }),
  })
  const data = (await res.json()) as { choices: [{ message: { content: string } }] }
  return JSON.parse(data.choices[0].message.content)
}

interface PipelineProgress {
  step: "idea" | "research" | "bm" | "roadmap" | "done" | "error"
  idea?: { problem: string; who: string }
  research?: Awaited<ReturnType<typeof generateResearch>>
  bm?: Awaited<ReturnType<typeof generateBusinessModel>>
  roadmap?: Awaited<ReturnType<typeof generateRoadmap>>
  plan?: string
  error?: string
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { idea } = await req.json()
  if (!idea || idea.length < 10) return Response.json({ error: "Please describe your idea in more detail" }, { status: 400 })

  const project = await ensureProject(userId)
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: PipelineProgress) => {
        controller.enqueue(new TextEncoder().encode(JSON.stringify(data) + "\n"))
      }

      try {
        // Step 1: Extract idea
        send({ step: "idea" })
        const inputs = await extractIdea(idea)
        send({ step: "idea", idea: { problem: inputs.problem, who: inputs.who } })

        // Step 2: Market Research
        send({ step: "research" })
        const research = await generateResearch(inputs)
        send({ step: "research", research })

        await prisma.researchReport.create({
          data: { projectId: project.id, topic: inputs.problem.slice(0, 200), summary: research.summary, content: research.summary, status: "completed" },
        })

        // Step 3: Business Model
        send({ step: "bm" })
        const bmContext = `Industry: ${inputs.problem}\nCustomer Type: ${inputs.who}\nResearch Findings: ${research.summary}`
        const bm = await generateBusinessModel({ industry: inputs.problem, customerType: inputs.who, context: bmContext })
        send({ step: "bm", bm })

        await prisma.businessModel.upsert({
          where: { projectId_version: { projectId: project.id, version: 1 } },
          create: { projectId: project.id, canvas: bm.canvas as any, version: 1 },
          update: { canvas: bm.canvas as any },
        })

        // Step 4: Roadmap
        send({ step: "roadmap" })
        const timeline = inputs.marketSize?.includes("B") ? "12 个月" : "6 个月"
        const roadmap = await generateRoadmap({ stage: "idea", timeline, context: `Research: ${research.summary}\nBusiness Model: ${bm.summary}` })
        send({ step: "roadmap", roadmap })

        await prisma.roadmap.upsert({
          where: { projectId_version: { projectId: project.id, version: 1 } },
          create: { projectId: project.id, phases: roadmap.phases as any, version: 1 },
          update: { phases: roadmap.phases as any },
        })

        // Step 5: Build complete plan
        const plan = [
          `# 🚀 ${inputs.problem}`,
          ``,
          `## 📊 Market Research`,
          research.summary,
          ``,
          `## 🎯 Business Model`,
          bm.summary,
          Object.entries(bm.metrics || {}).map(([k, v]) => `- **${k}**: ${v}`).join("\n"),
          ``,
          `## 🗺️ Roadmap`,
          roadmap.summary,
          roadmap.phases?.map((p: any) => `### ${p.name} (${p.duration})\n${p.objective}\n${p.tasks?.map((t: any) => `- [${t.priority}] ${t.title}`).join("\n") || ""}`).join("\n\n"),
          ``,
          `## ✅ Next Steps`,
          ...(roadmap.nextActions || []).map((a: string) => `1. ${a}`),
          ``,
          `## ⚠️ Risks to Watch`,
          ...(roadmap.riskLog || []).map((r: any) => `- **${r.risk}** (${r.probability}): ${r.mitigation}`),
        ].join("\n")

        send({ step: "done", plan })

        await prisma.memory.create({
          data: { projectId: project.id, type: "strategy", title: `创业计划: ${inputs.problem.slice(0, 60)}`, content: plan, source: "auto", importance: 10 },
        })

        controller.close()
      } catch (e: any) {
        send({ step: "error", error: e.message || "Pipeline failed" })
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Transfer-Encoding": "chunked" },
  })
}
