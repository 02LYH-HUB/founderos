/**
 * Safe JSON parse with retry for LLM outputs.
 * Retries once with a "fix the JSON" prompt on failure.
 */

const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY!

export async function safeJsonParse(raw: string, retryPrompt: string): Promise<any> {
  // Try direct parse first — clean common LLM artifacts
  const cleaned = raw.replace(/```json\n?/g, "").replace(/```/g, "").trim()
  try {
    return JSON.parse(cleaned)
  } catch {
    // Second pass: try to extract JSON from markdown
    const match = cleaned.match(/\{[\s\S]*\}/)
    if (match) {
      try { return JSON.parse(match[0]) } catch {}
    }
  }

  // Retry with fix prompt
  try {
    const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${DEEPSEEK_KEY}` },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: "You are a JSON repair tool. Return ONLY valid JSON, no explanations." },
          { role: "user", content: `${retryPrompt}\n\nRaw output to fix:\n${raw.slice(0, 3000)}` },
        ],
        temperature: 0,
        max_tokens: 2000,
        response_format: { type: "json_object" },
      }),
    })
    const data = (await res.json()) as { choices: [{ message: { content: string } }] }
    return JSON.parse(data.choices[0].message.content.replace(/```json\n?/g, "").replace(/```/g, "").trim())
  } catch {
    throw new Error("Failed to parse AI output after retry")
  }
}
