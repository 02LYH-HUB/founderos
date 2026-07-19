/**
 * Business Model Engine — Professional startup business model canvas
 * 
 * Framework: Strategyzer Business Model Canvas + a16z startup metrics + Sequoia business plan
 */

const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY!

interface BMInput {
  industry: string
  customerType: string
  context?: string
  projectName?: string
}

export async function generateBusinessModel(input: BMInput): Promise<{
  summary: string
  canvas: Record<string, string>
  metrics: Record<string, any>
  risks: string[]
  nextSteps: string[]
}> {
  const prompt = `You are a startup strategist who has helped 100+ companies build their business models. Generate a complete, realistic business model for this startup.

## Context
- **Industry/Category**: ${input.industry}
- **Customer Type**: ${input.customerType}
${input.context ? `- **Founder Context**: ${input.context}` : ""}
${input.projectName ? `- **Project**: ${input.projectName}` : ""}

## Required Output (JSON only, no markdown)
{
  "summary": "One paragraph synthesis of the business model",

  "canvas": {
    "customerSegments": "Who pays? Who uses? Be specific about demographics, behaviors, and willingness to pay.",
    "valuePropositions": "What specific pain do you solve? Why would someone switch from existing solutions? Quantify the value (e.g., saves X hours, reduces cost by Y%).",
    "channels": "How do you reach customers? Include estimated cost per channel and expected conversion rate. Rank by effectiveness.",
    "customerRelationships": "Self-serve? Sales-led? Community-driven? What's the onboarding process? Include estimated support cost per customer.",
    "revenueStreams": "Primary and secondary revenue. Include realistic pricing tiers, estimated ARPU, and projected revenue mix. Consider freemium conversion, enterprise upsells, add-ons.",
    "keyResources": "What assets do you absolutely need? (tech, IP, team, data, brand, partnerships). What's the estimated cost to acquire/build each?",
    "keyActivities": "What must you do every day to deliver value? Product development, content creation, sales calls, customer support. Estimate time allocation.",
    "keyPartnerships": "Who do you need to work with? (API providers, distribution partners, influencers, payment processors). What's the dependency risk?",
    "costStructure": "Monthly costs broken down: engineering salaries, server/infra, marketing budget, office/tools, legal/compliance, customer support. Estimate runway with different funding levels."
  },

  "metrics": {
    "estimatedCAC": "Customer acquisition cost by primary channel (with reasoning)",
    "estimatedLTV": "Lifetime value calculation (ARPU x average customer lifetime, with churn assumptions)",
    "ltvCacRatio": "LTV/CAC ratio as a number e.g. 3.5 (target >3 for healthy business)",
    "breakevenMonths": "Estimated months to breakeven on customer acquisition spend",
    "grossMargin": "Estimated gross margin as percentage (revenue minus direct costs)",
    "monthlyBurn": "Estimated monthly cash burn at seed stage",
    "runwayMonths": "Months of runway with a $50K seed investment",
    "revenueYear1": "Realistic Year 1 revenue estimate (pessimistic/realistic/optimistic)"
  },

  "risks": [
    "Top 3 business model risks with specific mitigation for each"
  ],

  "nextSteps": [
    "3 concrete actions to take this week to validate or build this model"
  ]
}

## Critical rules
- Use SPECIFIC numbers. If you estimate, say "est. $XX" with reasoning. No vague statements.
- Consider real costs: SaaS tools, cloud hosting, payment processing fees (Stripe ~2.9%+$0.30), marketing CPC rates, contractor rates, legal incorporation costs.
- For Chinese/Asian market context: consider WeChat ecosystem, mini-programs, Alipay, Douyin marketing costs.
- Include realistic conversion rates (e.g., free-to-paid 2-5%, trial-to-paid 15-25%, landing page visitor-to-signup 3-8%).
- Be BRUTALLY honest about whether this business model can work. If unit economics don't add up, say so.`

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
  const json = JSON.parse(data.choices[0].message.content)
  return {
    summary: json.summary,
    canvas: json.canvas,
    metrics: json.metrics || {},
    risks: json.risks || [],
    nextSteps: json.nextSteps || [],
  }
}
