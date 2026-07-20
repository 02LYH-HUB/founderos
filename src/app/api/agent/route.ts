import { prisma } from "@/lib/db"
import { auth } from "@clerk/nextjs/server"

const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY!

const AGENT_PROMPTS: Record<string, { name: string; emoji: string; prompt: (context: string) => string }> = {
  ceo: {
    name: "AI CEO",
    emoji: "🤖",
    prompt: (ctx) => `You are the CEO Agent. Based on this project context: ${ctx}\n\nGive the founder 3-5 strategic recommendations. Include: what to focus on this week, key risks, and one bold move.`
  },
  pm: {
    name: "AI PM",
    emoji: "🤖",
    prompt: (ctx) => `You are the PM Agent. Based on this project context: ${ctx}\n\nBreak down the next milestone into concrete tasks with owners, estimates, and priority.`
  },
  engineer: {
    name: "AI Engineer",
    emoji: "🛠️",
    prompt: (ctx) => `You are the Engineer Agent. Based on: ${ctx}\n\nRecommend: 1) Tech stack choices with reasoning 2) Architecture overview 3) MVP build plan (phased) 4) Estimated dev timeline and team size`
  },
  marketing: {
    name: "AI Marketing",
    emoji: "📣",
    prompt: (ctx) => `You are the Marketing Agent for a startup. Based on: ${ctx}\n\nCreate a 30-day launch plan covering: SEO keywords, content pillars, social media strategy, ad channels with estimated CAC, and one "unfair" distribution hack.`
  },
  designer: {
    name: "AI Designer",
    emoji: "🎨",
    prompt: (ctx) => `You are the Design Agent for a startup. Based on: ${ctx}\n\nRecommend: 1) Brand personality & design direction 2) Color palette with rationale 3) Typography system 4) Key UI/UX patterns 5) First impressions to optimize`
  },
  finance: {
    name: "AI Finance",
    emoji: "💰",
    prompt: (ctx) => `You are the Finance Agent for a startup. Based on: ${ctx}\n\nBuild: 1) Recommended pricing strategy (3 tiers) 2) 12-month revenue forecast 3) Unit economics breakdown (CAC, LTV, gross margin) 4) Burn rate & runway analysis 5) Key financial milestones`
  },
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { type, context } = await req.json()
  if (!type || !AGENT_PROMPTS[type]) return Response.json({ error: "Invalid agent type" }, { status: 400 })

  const company = await prisma.company.findFirst({ where: { userId } })
  const project = company ? await prisma.project.findFirst({ where: { companyId: company.id } }) : null

  const agent = AGENT_PROMPTS[type]
  const fullContext = context || `Startup name: ${project?.name || "My Startup"}\nDescription: ${project?.description || "Building something new"}`

  try {
    const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${DEEPSEEK_KEY}` },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "system", content: "You are a startup advisor. Return detailed markdown with actionable advice." }, { role: "user", content: agent.prompt(fullContext) }],
        temperature: 0.4, max_tokens: 2000,
      }),
    })
    const data = (await res.json()) as { choices: [{ message: { content: string } }] }
    return Response.json({ content: data.choices[0].message.content, agentName: agent.name, agentEmoji: agent.emoji })
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
