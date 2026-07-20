import { prisma } from "@/lib/db"
import { embed, cosSimilarity } from "./embed"

export async function searchMemories(projectId: string, query: string, limit = 5) {
  const queryEmbedding = await embed(query.slice(0, 500))

  // Try pgvector first (uses vector column with ivfflat index)
  try {
    const results = await prisma.$queryRawUnsafe<{ id: string }[]>(
      `SELECT id FROM memories WHERE project_id = $1 AND embedding IS NOT NULL ORDER BY embedding <=> $2::vector LIMIT $3`,
      projectId, `[${queryEmbedding.join(",")}]`, limit
    )
    if (results?.length) {
      const ids = results.map((r) => r.id)
      const scored = await prisma.memory.findMany({ where: { id: { in: ids } } })
      scored.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id))
      return scored
    }
  } catch {
    // pgvector not set up — fall through to JS cosine
  }

  // Fallback: JS cosine similarity on JSONB embeddings
  const memories = await prisma.memory.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  const scored = memories.map((m) => {
    const emb = (m.metadata as Record<string, unknown>).embedding as number[] | undefined
    if (!emb) return { memory: m, score: 0 }
    return { memory: m, score: cosSimilarity(queryEmbedding, emb) * 0.7 + (m.importance / 10) * 0.3 }
  })

  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, limit).map((s) => s.memory)
}
