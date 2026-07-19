/**
 * Roadmap Engine — Professional startup execution plan
 * 
 * Framework: First Round execution planning + YC milestone-driven development + Lean Startup build-measure-learn
 */

const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY!

interface RoadmapInput {
  stage: string
  timeline: string
  context?: string
  projectName?: string
}

export async function generateRoadmap(input: RoadmapInput): Promise<{
  summary: string
  phases: { name: string; duration: string; objective: string; kpi: string; tasks: { title: string; priority: string; effort: string; cost: string }[] }[]
  riskLog: { risk: string; probability: string; impact: string; mitigation: string }[]
  resourcePlan: { role: string; when: string; cost: string; fullTime: boolean }[]
  financialProjection: { month: number; burn: string; revenue: string; milestone: string }[]
  nextActions: string[]
}> {
  const prompt = `You are a startup execution coach who has guided 50+ companies from idea to Series A. Build an actionable, realistic startup roadmap.

## Context
- **Current Stage**: ${input.stage}
- **Timeline**: ${input.timeline}
${input.context ? `- **Founder Context**: ${input.context}` : ""}
${input.projectName ? `- **Project**: ${input.projectName}` : ""}

## Key constraints to consider
- Solo founder or small team = limited bandwidth. Be realistic about what one person can do.
- Bootstrapping means every dollar counts. Include cost estimates.
- The first milestone should be VALIDATION (talk to customers), not coding.
- Chinese startup context if relevant: use domestic tools (WeChat, Douyin, Alipay mini-programs) for GTM.

## Required Output (JSON only)
{
  "summary": "Overview of the roadmap, key milestones, and total estimated cost",

  "phases": [
    {
      "name": "Phase 1: Discovery & Validation",
      "duration": "Weeks 1-2",
      "objective": "Validate that people actually want this before building",
      "kpi": "Talked to 20 potential customers, 15 said they'd pay",
      "tasks": [
        { "title": "Create customer interview script", "priority": "critical", "effort": "4 hours", "cost": "$0" },
        { "title": "Interview 20 target customers", "priority": "critical", "effort": "20 hours", "cost": "$0" },
        { "title": "Build landing page with waitlist", "priority": "high", "effort": "8 hours", "cost": "$12 (domain)" }
      ]
    }
  ],

  "riskLog": [
    {
      "risk": "Building something nobody wants",
      "probability": "high",
      "impact": "fatal",
      "mitigation": "Talk to 20 customers before writing any code. If <30% express strong interest, pivot."
    }
  ],

  "resourcePlan": [
    { "role": "Founder (you)", "when": "Weeks 1-12", "cost": "$0 (sweat equity)", "fullTime": true },
    { "role": "Freelance designer", "when": "Weeks 4-6", "cost": "$500-1000", "fullTime": false }
  ],

  "financialProjection": [
    { "month": 1, "burn": "$200 (domain, hosting, tools)", "revenue": "$0", "milestone": "Validated problem" },
    { "month": 3, "burn": "$500 (freelancer, ads test)", "revenue": "$0-500", "milestone": "MVP launched" }
  ],

  "nextActions": [
    "3 things to do THIS WEEK — specific, timeboxed, with expected outcomes"
  ]
}

## Rules
- Include COST estimates for every task that costs money. Founders need to budget.
- Each phase must have a clear KPI (not just "build stuff" — "X customers, Y revenue, Z% conversion").
- Be realistic about solo founder bandwidth. Don't plan 80-hour weeks.
- The first phase should ALWAYS be customer discovery, not development.
- For the financial projection, include: monthly burn, expected revenue (even if $0), and the key milestone for that month.
- If the founder is pre-product, the first 4 weeks should be: talk to users, build waitlist, validate pricing — NOT write code.
- Risk log should be actionable: specific risks with specific mitigations, not generic warnings.`

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
    phases: json.phases,
    riskLog: json.riskLog || [],
    resourcePlan: json.resourcePlan || [],
    financialProjection: json.financialProjection || [],
    nextActions: json.nextActions || [],
  }
}
