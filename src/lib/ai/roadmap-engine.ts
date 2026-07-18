/**
 * Roadmap Engine — DeepSeek generates phased startup roadmap
 */

const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY!

export async function generateRoadmap(stage: string, timeline: string, companyContext?: string): Promise<{
  summary: string
  phases: { name: string; duration: string; objective: string; tasks: { title: string; priority: string }[] }[]
}> {
  const prompt = `You are a startup product manager. Generate a realistic, actionable startup roadmap.

Current Stage: ${stage}
Timeline: ${timeline}
${companyContext ? `Company Context: ${companyContext}` : ""}

Return exactly this JSON (no markdown):
{
  "summary": "Overview of the roadmap",
  "phases": [
    {
      "name": "Phase 1: MVP Development",
      "duration": "Weeks 1-4",
      "objective": "Build and launch MVP",
      "tasks": [
        { "title": "Set up development environment", "priority": "high" },
        { "title": "Build core features", "priority": "high" }
      ]
    }
  ]
}

Rules:
- Generate 3-4 phases covering the full timeline
- Each phase has 3-5 specific, actionable tasks
- Tasks should be concrete ("Set up CI/CD pipeline") not vague ("Do stuff")
- Priorities: high / medium / low
- Be realistic about what one person can achieve` 

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
  return { summary: json.summary, phases: json.phases }
}
