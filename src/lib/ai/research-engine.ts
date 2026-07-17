/**
 * Research Engine — 阿里 DashScope (Qwen) + search
 */

const API_KEY = process.env.DASHSCOPE_API_KEY!
const DASHSCOPE_URL = "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation"

interface ResearchReport {
  topic: string
  summary: string
  sections: { title: string; content: string }[]
  rawContent: string
}

export async function generateResearch(topic: string, companyContext?: string): Promise<ResearchReport> {
  const prompt = `You are a market research analyst. Generate a comprehensive, structured market research report on the following topic.

Topic: ${topic}

${companyContext ? `Company context: ${companyContext}\n` : ""}
Format your response as follows:

## Summary
[A 2-3 sentence executive summary]

## Market Overview
[Market size, growth rate, key trends]

## Target Users
[Who are the customers, demographics, pain points]

## Competitive Landscape
[Key competitors, their strengths and weaknesses]

## SWOT Analysis
- Strengths
- Weaknesses
- Opportunities
- Threats

## Entry Strategy
[Recommended go-to-market approach, pricing, channels]

## Risk Assessment
[Key risks and mitigation strategies]

Use specific data, numbers, and real examples wherever possible.`

  const res = await fetch(DASHSCOPE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: "qwen-plus",
      input: { messages: [{ role: "user", content: prompt }] },
      parameters: {
        enable_search: true,
        result_format: "message",
      },
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`DashScope error ${res.status}: ${err.slice(0, 200)}`)
  }

  const data = (await res.json()) as {
    output?: { choices?: { message?: { content?: string } }[] }
  }

  const rawContent = data.output?.choices?.[0]?.message?.content || ""
  return parseReport(topic, rawContent)
}

function parseReport(topic: string, content: string): ResearchReport {
  const sections: { title: string; content: string }[] = []
  const sectionRegex = /#{1,3}\s+(.+?)\n([\s\S]*?)(?=\n#{1,3}\s|$)/g
  let match

  while ((match = sectionRegex.exec(content)) !== null) {
    const title = match[1].trim()
    const body = match[2].trim()
    if (!title.toLowerCase().includes("summary")) {
      sections.push({ title, content: body })
    }
  }

  const summaryMatch = content.match(/#{1,3}\s*Summary\s*\n([\s\S]*?)(?=\n#{1,3}\s|$)/i)
  const summary = summaryMatch?.[1]?.trim() || content.slice(0, 200)

  return { topic, summary, sections, rawContent: content }
}
