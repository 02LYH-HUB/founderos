import { createDeepSeek } from "@ai-sdk/deepseek"
import { streamText } from "ai"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db"
import { embed } from "@/lib/rag/embed"
import { searchMemories } from "@/lib/rag/retrieve"

async function ensureUser(userId: string) {
  const exists = await prisma.user.findUnique({ where: { id: userId } })
  if (!exists) {
    await prisma.user.create({
      data: { id: userId, email: `user_${userId.slice(-8)}@founderos.local` },
    })
  }
}

const deepseek = createDeepSeek({
  apiKey: process.env.DEEPSEEK_API_KEY!,
  baseURL: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com",
})

export async function POST(req: Request) {
  try {
    const { projectId, message } = await req.json()
    if (!projectId || !message) {
      return Response.json({ error: "Missing projectId or message" }, { status: 400 })
    }

    // Ensure user exists (for FK constraints)
    const { userId } = await auth()
    if (userId) await ensureUser(userId)

    // Semantic memory search
    let memories = await prisma.memory.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      take: 5,
    })
    try {
      memories = await searchMemories(projectId, message, 5)
    } catch (e) {
      console.warn("Semantic search failed, using recent:", e)
    }

    const history = await prisma.conversation.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      take: 10,
    })

    const memoryContext = memories
      .map((m) => `[${m.type}] ${m.title}: ${m.content}`)
      .join("\n")

    const systemPrompt = `You are FounderOS, an AI co-founder for solo founders.
You help with business strategy, market research, product development, and execution.

The founder's company context (from memory):
${memoryContext || "No memories yet. Ask the founder about their business."}

Guidelines:
- Be direct and actionable. Give specific advice, not vague suggestions.
- Reference the founder's actual business context when available.
- When asked for research, business models, or roadmaps, indicate you'll generate them.
- Keep responses concise and focused on execution.`

    await prisma.conversation.create({
      data: { projectId, role: "user", content: message },
    })

    const result = streamText({
      model: deepseek("deepseek-chat"),
      system: systemPrompt,
      messages: [
        ...history.reverse().map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
        { role: "user" as const, content: message },
      ],
      onFinish: async ({ text }) => {
        await prisma.conversation.create({
          data: {
            projectId,
            role: "assistant",
            content: text,
            modelUsed: "deepseek-chat",
          },
        })

        // Auto-extract memory
        if (text.length > 200) {
          const firstLine = text.split("\n")[0].slice(0, 100)
          let embedding: number[] | null = null
          try {
            embedding = await embed(text.slice(0, 500))
          } catch {}

          await prisma.memory.create({
            data: {
              projectId,
              type: "note",
              title: firstLine,
              content: text.slice(0, 500),
              source: "auto",
              importance: 3,
              metadata: embedding ? { embedding } : {},
            },
          })
        }
      },
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error("Chat error:", error)
    return Response.json({ error: "Chat generation failed" }, { status: 500 })
  }
}
