/**
 * Intent Router — classifies user messages to route to the right agent
 * Uses DeepSeek V3 for lightweight intent classification
 */

const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY!

type Intent = "research" | "bm" | "roadmap" | "chat" | "pipeline"

interface IntentResult {
  intent: Intent
  topic: string
  confidence: number
}

export async function routeIntent(message: string): Promise<IntentResult> {
  const prompt = `Classify this startup founder's message. Return ONLY JSON.

Message: "${message}"

{
  "intent": "research" | "bm" | "roadmap" | "chat" | "pipeline",
  "topic": "extracted topic for research/generation",
  "confidence": 0.0-1.0
}

Rules:
- "pipeline" = user wants full startup plan (mentions "plan", "from scratch", "everything")
- "research" = wants market/competitor analysis
- "bm" = wants business model canvas
- "roadmap" = wants execution plan / timeline
- "chat" = general question or conversation`

  const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${DEEPSEEK_KEY}` },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 200,
      temperature: 0,
      response_format: { type: "json_object" },
    }),
  })

  if (!res.ok) return { intent: "chat", topic: message, confidence: 0.5 }
  const data = (await res.json()) as { choices: [{ message: { content: string } }] }
  const json = JSON.parse(data.choices[0].message.content)
  return { intent: json.intent || "chat", topic: json.topic || message, confidence: json.confidence || 0.5 }
}

/**
 * Memory extraction — extracts important info from conversations using LLM
 */
export async function extractMemory(text: string): Promise<{ title: string; type: string; importance: number } | null> {
  if (text.length < 300) return null

  const prompt = `Extract the single most important business insight from this text. If nothing valuable, return {"has_info": false}.

Text: "${text.slice(0, 1500)}"

Return ONLY JSON:
{
  "has_info": true/false,
  "title": "short title (max 60 chars)",
  "type": "research" | "strategy" | "idea" | "decision" | "goal",
  "importance": 1-10
}`

  try {
    const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${DEEPSEEK_KEY}` },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 300,
        temperature: 0,
        response_format: { type: "json_object" },
      }),
    })

    if (!res.ok) return null
    const data = (await res.json()) as { choices: [{ message: { content: string } }] }
    const json = JSON.parse(data.choices[0].message.content)
    if (!json.has_info) return null
    return { title: json.title?.slice(0, 60) || "Memory", type: json.type || "note", importance: Math.min(10, Math.max(1, json.importance || 5)) }
  } catch {
    return null
  }
}
