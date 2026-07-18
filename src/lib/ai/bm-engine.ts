/**
 * Business Model Engine — DeepSeek generates 9-module canvas
 */

const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY!

export async function generateBusinessModel(industry: string, customerType: string, companyContext?: string): Promise<{
  summary: string
  canvas: Record<string, string>
}> {
  const prompt = `You are a startup strategist. Generate a complete Business Model Canvas for a startup.

Industry: ${industry}
Customer Type: ${customerType}
${companyContext ? `Company Context: ${companyContext}` : ""}

Return exactly this JSON structure (no markdown, no explanation):
{
  "summary": "One-sentence summary of the business model",
  "canvas": {
    "customerSegments": "...",
    "valuePropositions": "...",
    "channels": "...",
    "customerRelationships": "...",
    "revenueStreams": "...",
    "keyResources": "...",
    "keyActivities": "...",
    "keyPartnerships": "...",
    "costStructure": "..."
  }
}`

  const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${DEEPSEEK_KEY}` },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      response_format: { type: "json_object" },
    }),
  })

  if (!res.ok) throw new Error(`DeepSeek error: ${res.status}`)
  const data = (await res.json()) as { choices: [{ message: { content: string } }] }
  const json = JSON.parse(data.choices[0].message.content)
  return { summary: json.summary, canvas: json.canvas }
}
