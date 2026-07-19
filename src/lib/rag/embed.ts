/**
 * Zhipu GLM Embedding-3 (1024-dim)
 * Writes to PostgreSQL vector column when pgvector is enabled
 */

const ZHIPU_API_KEY = process.env.ZHIPU_API_KEY!
const ZHIPU_EMBED_URL = "https://open.bigmodel.cn/api/paas/v4/embeddings"

export async function embed(text: string): Promise<number[]> {
  const res = await fetch(ZHIPU_EMBED_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${ZHIPU_API_KEY}` },
    body: JSON.stringify({ model: "embedding-3", input: text, dimensions: 1024 }),
  })
  if (!res.ok) throw new Error(`Embedding API error: ${res.status}`)
  const data = (await res.json()) as { data: { embedding: number[] }[] }
  return data.data[0].embedding
}

export function cosSimilarity(a: number[], b: number[]): number {
  let dot = 0, magA = 0, magB = 0
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; magA += a[i] * a[i]; magB += b[i] * b[i] }
  if (magA === 0 || magB === 0) return 0
  return dot / (Math.sqrt(magA) * Math.sqrt(magB))
}
