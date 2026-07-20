import { prisma } from "@/lib/db"
import { auth } from "@clerk/nextjs/server"

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { projectId, module, agentType, messages } = await req.json()
  if (!projectId || !module || !messages) return Response.json({ error: "Missing fields" }, { status: 400 })

  // Delete old messages for this thread, then insert new ones
  await prisma.conversation.deleteMany({
    where: { projectId, intent: `followup:${module}` },
  })

  await prisma.conversation.createMany({
    data: messages.map((m: { role: string; content: string }, i: number) => ({
      projectId,
      role: m.role,
      content: m.content,
      intent: `followup:${module}`,
      metadata: { agentType, module, order: i },
    })),
  })

  return Response.json({ ok: true })
}

export async function GET(req: Request) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get("projectId")
  const module = searchParams.get("module")
  if (!projectId || !module) return Response.json({ error: "Missing params" }, { status: 400 })

  const rows = await prisma.conversation.findMany({
    where: { projectId, intent: `followup:${module}` },
    orderBy: { createdAt: "asc" },
  })

  const messages = rows
    .filter(r => r.role === "user" || r.role === "assistant")
    .map(r => ({ role: r.role, content: r.content }))

  return Response.json({ messages, agentType: rows[0]?.metadata as any as string | undefined })
}
