import { prisma } from "@/lib/db"
import { auth } from "@clerk/nextjs/server"

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { projectId, module, agentType, messages } = await req.json()
  if (!projectId || !module || !messages) return Response.json({ error: "Missing fields" }, { status: 400 })

  // Get existing count to compute offset
  const existing = await prisma.conversation.count({
    where: { projectId, intent: `followup:${module}` },
  })

  // Append only new messages beyond what's already saved
  const toInsert = messages.slice(existing).map((m: { role: string; content: string }, i: number) => ({
    projectId,
    role: m.role,
    content: m.content,
    intent: `followup:${module}`,
    metadata: { agentType, order: existing + i },
  }))

  if (toInsert.length > 0) {
    await prisma.conversation.createMany({ data: toInsert })
  }

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
    orderBy: [{ createdAt: "asc" }],
  })

  // Sort by metadata.order, fallback to createdAt order
  rows.sort((a, b) => {
    const aOrder = (a.metadata as any)?.order ?? 0
    const bOrder = (b.metadata as any)?.order ?? 0
    return aOrder - bOrder
  })

  const msgs = rows
    .filter(r => r.role === "user" || r.role === "assistant")
    .map(r => ({ role: r.role, content: r.content }))

  const agentType = (rows[0]?.metadata as any)?.agentType

  return Response.json({ messages: msgs, agentType })
}
