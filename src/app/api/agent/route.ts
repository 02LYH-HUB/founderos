import { prisma } from "@/lib/db"
import { auth } from "@clerk/nextjs/server"

const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY!

const AGENTS: Record<string, { name: string; emoji: string; system: string }> = {
  ceo: { name: "AI CEO", emoji: "🤖", system: "You are the CEO Agent—strategic advisor to a solo founder. Give concise, actionable advice with context. Focus on what matters this week." },
  pm: { name: "AI PM", emoji: "🤖", system: "You are the PM Agent—task and roadmap manager. Break down work into clear steps with priority and estimates." },
  engineer: { name: "AI Engineer", emoji: "🛠️", system: "You are the Engineer Agent—tech architecture and build advisor. Recommend practical, cost-effective technical decisions." },
  marketing: { name: "AI Marketing", emoji: "📣", system: "You are the Marketing Agent—growth and distribution expert. Create actionable launch and acquisition plans." },
  designer: { name: "AI Designer", emoji: "🎨", system: "You are the Design Agent—brand and UX advisor. Give practical design direction for early-stage products." },
  finance: { name: "AI Finance", emoji: "💰", system: "You are the Finance Agent—pricing and unit economics expert. Build financial models and forecasts." },
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { type, messages, context, moduleTitle, moduleContent } = body
  if (!type || !AGENTS[type]) return Response.json({ error: "Invalid agent type" }, { status: 400 })

  const agent = AGENTS[type]

  // Build project context for system prompt
  const company = await prisma.company.findFirst({ where: { userId } })
  const project = company ? await prisma.project.findFirst({ where: { companyId: company.id } }) : null
  const projectCtx = `Project: ${project?.name || "My Startup"}\nDescription: ${project?.description || "Building something new"}`

  // Build system message with optional module context
  let systemMsg = agent.system + `\n\nProject context:\n${projectCtx}`
  if (moduleTitle) {
    systemMsg += `\n\nThe founder is asking about one specific part: "${moduleTitle}".\nContent of that part:\n${moduleContent || "(not provided)"}\nStay focused on this part unless they zoom out.`
  }
  if (context && !messages) {
    systemMsg += `\n\nAdditional context:\n${context}`
  }

  // Build messages array:
  // If multi-turn: prepend system + use client-provided messages
  // If single-turn (backcompat): use system + agent's default prompt
  const deepseekMessages = messages
    ? [{ role: "system", content: systemMsg }, ...messages] as const
    : [{ role: "system", content: systemMsg + "\n\nReturn detailed markdown with actionable advice." }, { role: "user", content: context || "Give me strategic advice." }] as const

  try {
    const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${DEEPSEEK_KEY}` },
      body: JSON.stringify({ model: "deepseek-chat", messages: deepseekMessages, temperature: 0.4, max_tokens: 2000 }),
    })
    const data = (await res.json()) as { choices: [{ message: { content: string } }] }
    return Response.json({ content: data.choices[0].message.content, agentName: agent.name, agentEmoji: agent.emoji })
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
