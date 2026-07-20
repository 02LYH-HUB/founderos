/**
 * Market Research Engine — Professional startup market analysis
 * 
 * Frameworks: Sequoia investment memo + YC market evaluation + Porter's Five Forces adapted for startups
 */

import { safeJsonParse } from "./safe-parse"

const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY!

interface ResearchInput {
  problem: string
  who: string
  currentSolutions: string
  marketSize: string
  advantage: string
  projectName?: string
}

export async function generateResearch(input: ResearchInput): Promise<{
  summary: string
  sections: Record<string, string>
  scores: Record<string, number>
  recommendation: string
}> {
  const prompt = `You are a senior startup analyst at a top-tier VC firm. Evaluate this startup idea with the rigor you would apply to a seed-stage investment memo.

## Startup Context
- **Problem**: ${input.problem}
- **Target Customer**: ${input.who}
- **Current Solutions**: ${input.currentSolutions}
- **Market Size (founder estimate)**: ${input.marketSize}
- **Unique Advantage**: ${input.advantage}
${input.projectName ? `- **Project**: ${input.projectName}` : ""}

## Required Output Format
Return ONLY valid JSON with this exact structure (no markdown, no explanation):

{
  "summary": "Executive summary — 3-4 sentences synthesizing the opportunity, key risks, and overall verdict",

  "scores": {
    "marketSize": 7,        // 1-10: how big and growing is this market?
    "teamFit": 6,            // 1-10: founder insight into the problem (based on their answers)
    "timing": 7,             // 1-10: why is now the right time?
    "defensibility": 5,      // 1-10: how hard to copy? (network effects, IP, brand, switching costs)
    "unitEconomics": 5       // 1-10: can this make money per customer?
  },

  "sections": {
    "marketOverview": "TAM, SAM, SOM analysis with concrete estimates. What is the total addressable market, what slice is reachable, what slice can you realistically capture in 3 years? Include growth rate and key drivers.",

    "competitorLandscape": "Direct competitors, indirect competitors, and substitutes. Include: company name, estimated funding, pricing, key differentiator. Format as a comparison with our startup's positioning.",

    "customerAnalysis": "Who is the exact customer? What is their willingness to pay? What is their current pain level (must-solve vs nice-to-have)? How do they make buying decisions? Include estimated CAC by channel.",

    "unitEconomics": "Customer Acquisition Cost by channel (SEO, paid ads, sales, referrals), Lifetime Value estimate, payback period, gross margin estimate. Be specific with numbers — even rough estimates are more useful than generic statements.",

    "goToMarket": "Top 3 go-to-market channels ranked by ROI. For each: estimated cost, expected conversion rate, timeline to first results, risk level. Include a concrete 90-day plan.",

    "risksAndMitigation": "Top 5 risks (market, execution, competitive, financial, regulatory). For each: probability (low/medium/high), impact, specific mitigation strategy.",

    "financialProjections": "Year 1 revenue scenarios (pessimistic, realistic, optimistic). Key assumptions. Monthly burn rate. Runway needed. When does breakeven happen?"
  },

  "recommendation": "Final verdict: Proceed / Pivot / Kill. Specific next action to take this week. One thing the founder should stop doing."
}

## Rules
- Use CONCRETE numbers everywhere. If you must estimate, label it as "estimated: X" with reasoning.
- Compare to real companies that have succeeded or failed in this space.
- Be brutally honest. Founders need the truth, not encouragement. If the idea has fatal flaws, say so.
- Think about costs: customer acquisition cost, server/infra, team salaries, marketing budget. Be specific.
- Consider the Chinese/global market dynamics relevant to this domain.`

  const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${DEEPSEEK_KEY}` },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 4000,
      response_format: { type: "json_object" },
    }),
  })

  if (!res.ok) throw new Error(`DeepSeek error: ${res.status}`)
  const data = (await res.json()) as { choices: [{ message: { content: string } }] }
  const json = await safeJsonParse(data.choices[0].message.content, "Parse market research report JSON")
  return {
    summary: json.summary,
    sections: json.sections,
    scores: json.scores || {},
    recommendation: json.recommendation,
  }
}
