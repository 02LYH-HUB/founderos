/**
 * Reflection Engine — Loop Agent pattern
 * After each AI generation, reflect: "What's missing? What's vague?"
 * Fill gaps in a second pass for higher-quality output.
 */

const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY!

interface ReflectionResult {
  hasGaps: boolean
  gaps: string[]  // specific things that are vague/missing
  focus: string   // refined prompt for the next iteration
}

/**
 * Reflect on generated content to find gaps
 * Returns null if content is already solid
 */
export async function reflect(output: string, context: string): Promise<ReflectionResult> {
  const prompt = `You are a critical reviewer. Analyze this AI-generated startup content and identify specific gaps.

## Context
${context}

## Content to review
${output.slice(0, 3000)}

## Instructions
Return ONLY JSON:
{
  "hasGaps": true/false,
  "gaps": ["Specific gap 1", "Specific gap 2"],
  "focus": "What the next iteration should focus on to fill the gaps"
}

Rules:
- Be brutally honest. If the content is generic or surface-level, call it out.
- Only report REAL gaps — don't invent issues for the sake of it.
- Focus on: missing data, vague statements, lack of numbers, unrealistic claims, missing competitor analysis, unclear go-to-market.
- hasGaps should be false ONLY if the content is genuinely actionable and specific.`

  try {
    const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${DEEPSEEK_KEY}` },
      body: JSON.stringify({ model: "deepseek-chat", messages: [{ role: "user", content: prompt }], temperature: 0.2, max_tokens: 500, response_format: { type: "json_object" } }),
    })
    const data = (await res.json()) as { choices: [{ message: { content: string } }] }
    return JSON.parse(data.choices[0].message.content)
  } catch {
    return { hasGaps: false, gaps: [], focus: "" }
  }
}

/**
 * Loop agent: execute → reflect → execute again until solid
 */
export async function loopAgentResult(
  initial: string,
  context: string,
  executor: (focus: string, previous: string) => Promise<string>,
  maxIterations = 2
): Promise<string> {
  let result = initial

  for (let i = 0; i < maxIterations; i++) {
    const feedback = await reflect(result, context)
    if (!feedback.hasGaps || !feedback.focus) break

    // Execute refinement with focused prompt
    const refined = await executor(feedback.focus, result)
    result = refined
  }

  return result
}
