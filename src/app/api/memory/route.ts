import { prisma } from "@/lib/db"
import { auth } from "@clerk/nextjs/server"
import { embed } from "@/lib/rag/embed"

async function getProjectId(userId: string) {
  await prisma.user.upsert({ where: { id: userId }, create: { id: userId, email: "" }, update: {} })
  const c = await prisma.company.findFirst({ where: { userId } })
  if (!c) return null
  const p = await prisma.project.findFirst({ where: { companyId: c.id } })
  return p?.id ?? null
}

export async function GET(req: Request) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get("projectId")
  const q = searchParams.get("q")
  const type = searchParams.get("type")

  if (!projectId) {
    return Response.json({ error: "Missing projectId" }, { status: 400 })
  }

  // Verify ownership
  const ownedId = await getProjectId(userId)
  if (!ownedId || ownedId !== projectId) {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  let memories
  if (q) {
    const { searchMemories } = await import("@/lib/rag/retrieve")
    memories = await searchMemories(projectId, q, 50)
  } else {
    memories = await prisma.memory.findMany({
      where: { projectId, ...(type ? { type } : {}) },
      orderBy: { createdAt: "desc" },
      take: 50,
    })
  }

  return Response.json({ memories })
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { projectId, type, title, content } = await req.json()
  if (!projectId || !title || !content) {
    return Response.json({ error: "Missing required fields" }, { status: 400 })
  }

  // Verify ownership
  const ownedId = await getProjectId(userId)
  if (!ownedId || ownedId !== projectId) {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  let embedding: number[] | null = null
  try {
    embedding = await embed(content.slice(0, 500))
  } catch (e) {
    console.warn("Embedding failed, saving without:", e)
  }

  const memory = await prisma.memory.create({
    data: {
      projectId,
      type: type || "note",
      title,
      content,
      source: "manual",
      metadata: embedding ? { embedding } : {},
    },
  })

  return Response.json({ memory })
}

export async function DELETE(req: Request) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return Response.json({ error: "Missing id" }, { status: 400 })

  // Verify memory belongs to user
  const memory = await prisma.memory.findUnique({ where: { id } })
  if (!memory) return Response.json({ error: "Not found" }, { status: 404 })
  const ownedId = await getProjectId(userId)
  if (!ownedId || ownedId !== memory.projectId) {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  await prisma.memory.delete({ where: { id } })
  return Response.json({ ok: true })
}
