import { prisma } from "@/lib/db"
import { embed } from "@/lib/rag/embed"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get("projectId")
  const q = searchParams.get("q")

  if (!projectId) {
    return Response.json({ error: "Missing projectId" }, { status: 400 })
  }

  let memories
  if (q) {
    const { searchMemories } = await import("@/lib/rag/retrieve")
    memories = await searchMemories(projectId, q, 50)
  } else {
    memories = await prisma.memory.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      take: 50,
    })
  }

  return Response.json({ memories })
}

export async function POST(req: Request) {
  const { projectId, type, title, content } = await req.json()

  if (!projectId || !title || !content) {
    return Response.json({ error: "Missing required fields" }, { status: 400 })
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
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return Response.json({ error: "Missing id" }, { status: 400 })

  await prisma.memory.delete({ where: { id } })
  return Response.json({ ok: true })
}
