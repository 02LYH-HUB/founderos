import { prisma } from "@/lib/db"
import { embed, cosSimilarity } from "./embed"

export async function searchMemories(projectId: string, query: string, limit = 5) {
  // 1. Generate embedding for query
  const queryEmbedding = await embed(query.slice(0, 500))

  // 2. Fetch memories with embeddings
  const memories = await prisma.memory.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    take: 200,
  })

  // 3. Compute cosine similarity
  const scored = memories.map((m) => {
    const emb = (m.metadata as Record<string, unknown>).embedding as number[] | undefined
    if (!emb) return { memory: m, score: 0 }
    const score = cosSimilarity(queryEmbedding, emb) * 0.7 + (m.importance / 10) * 0.3
    return { memory: m, score }
  })

  // 4. Sort and return top K
  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, limit).map((s) => s.memory)
}
