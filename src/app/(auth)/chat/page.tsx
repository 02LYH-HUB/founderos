"use client"

import { useState, useEffect } from "react"

type Result = { title: string; content: string } | null

/* ── Industry options ── */
const INDUSTRIES = [
  "💻 科技/SaaS", "🏥 健康/医疗", "📚 教育/培训", "💰 金融/支付",
  "🛒 电商/零售", "🎮 游戏/娱乐", "🏠 房产/家居", "🚗 出行/交通",
  "🍽️ 餐饮/食品", "🌏 出海/跨境", "🤖 AI/大模型", "📱 社交/社区",
]

const CUSTOMER_TYPES = ["B2C (消费者)", "B2B (企业)", "B2B2C (平台)", "C2C (用户间)"]
const STAGES = ["Idea (想法阶段)", "MVP (最小产品)", "Growth (增长中)", "Scale (规模化)"]
const TIMELINES = ["3 个月", "6 个月", "12 个月"]
const IDEA_DOMAINS = ["AI 工具", "内容创作", "效率工具", "社交社区", "电商工具", "开发者工具", "教育学习", "健康生活"]

/* ── Module definitions ── */
const MODULES = [
  { id: "research", title: "市场研究", desc: "选行业，AI 生成市场报告", icon: "📊" },
  { id: "bm", title: "商业模式", desc: "选行业+客群，生成画布", icon: "🎯" },
  { id: "roadmap", title: "启动路线图", desc: "选阶段+时间，生成路线", icon: "🗺️" },
  { id: "idea", title: "创意验证", desc: "选领域，AI 生成创业点子", icon: "💡" },
]

export default function WorkbenchPage() {
  const [projectId, setProjectId] = useState<string | null>(null)
  const [projectName, setProjectName] = useState("")
  const [activeModule, setActiveModule] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState<Result>(null)
  const [error, setError] = useState<string | null>(null)

  // Research form state
  const [industry, setIndustry] = useState("")
  const [customIndustry, setCustomIndustry] = useState("")
  // BM form state
  const [customerType, setCustomerType] = useState("")
  const [bmIndustry, setBmIndustry] = useState("")
  // Roadmap form state
  const [stage, setStage] = useState("")
  const [timeline, setTimeline] = useState("")
  // Idea form state
  const [ideaDomain, setIdeaDomain] = useState("")

  useEffect(() => {
    fetch("/api/dashboard")
      .then(async (r) => { if (!r.ok) throw new Error(); return r.json() })
      .then((d) => { if (d.project?.id) { setProjectId(d.project.id); setProjectName(d.project.name) } })
      .catch(() => setError("项目加载失败"))
  }, [])

  const getIndustry = () => industry === "✏️ 其他（自定义）" ? customIndustry : industry

  async function generateResearch() {
    const ind = getIndustry()
    if (!ind) return
    setIsGenerating(true); setResult(null); setError(null)
    try {
      const r = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: `${ind}行业市场分析` }),
      })
      const data = await r.json()
      if (data.report) setResult({ title: data.report.topic, content: data.report.summary })
      else throw new Error("No report")
    } catch { setError("生成失败，请重试") }
    setIsGenerating(false)
  }

  async function generateBM() {
    if (!bmIndustry || !customerType) return
    setIsGenerating(true); setResult(null); setError(null)
    try {
      const r = await fetch("/api/business-model", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ industry: bmIndustry, customerType }),
      })
      const data = await r.json()
      if (data.summary) {
        const mods = data.canvas ? Object.entries(data.canvas as Record<string,string>).map(([k,v]) => `**${k}**: ${v}`).join("\n\n") : data.summary
        setResult({ title: `${bmIndustry} · ${customerType}`, content: `## 摘要\n${data.summary}\n\n## 画布\n${mods}` })
      } else throw new Error(data.error)
    } catch (e: any) { setError(e.message || "生成失败") }
    setIsGenerating(false)
  }

  async function generateRoadmap() {
    if (!stage || !timeline) return
    setIsGenerating(true); setResult(null); setError(null)
    try {
      const r = await fetch("/api/roadmap", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage, timeline }),
      })
      const data = await r.json()
      if (data.summary) {
        const phases = (data.phases as any[])?.map((p:any) => 
          `### ${p.name} (${p.duration})\n${p.objective}\n${p.tasks.map((t:any) => `- [${t.priority}] ${t.title}`).join("\n")}`
        ).join("\n\n") || data.summary
        setResult({ title: `${stage} → ${timeline} 路线图`, content: `## 摘要\n${data.summary}\n\n${phases}` })
      } else throw new Error(data.error)
    } catch (e: any) { setError(e.message || "生成失败") }
    setIsGenerating(false)
  }

  function generateIdea() {
    if (!ideaDomain) return
    setIsGenerating(true); setResult(null); setError(null)
    // Quick chat call for idea generation
    fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, message: `为"${ideaDomain}"领域生成3个创业创意点子，每个包含一句话描述和一句话可行性分析` }),
    }).then(async (r) => {
      const reader = r.body?.getReader()
      if (!reader) throw new Error()
      const decoder = new TextDecoder()
      let text = ""
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        text += decoder.decode(value, { stream: true })
      }
      setResult({ title: `${ideaDomain} · 创业创意`, content: text })
    }).catch(() => setError("生成失败"))
      .finally(() => setIsGenerating(false))
  }

  function resetModule() { setActiveModule(null); setResult(null); setError(null); setIndustry(""); setCustomIndustry("") }

  if (!projectId) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0a0a0f]">
        <div className="text-[#a1a1aa]">{error || "Loading..."}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <div className="max-w-4xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: "Outfit, sans-serif" }}>AI Co-founder</h1>
          <p className="text-sm text-[#71717a]">{projectName} · 选择一项功能开始</p>
        </div>

        {/* Module grid — only show when no module active */}
        {!activeModule && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {MODULES.map((m) => (
              <button
                key={m.id}
                onClick={() => setActiveModule(m.id)}
                className="p-6 rounded-2xl bg-[#18181b] border border-[#27272a] text-left hover:border-[#9FFF00]/30 hover:bg-[#1a1a20] transition-all cursor-pointer group"
              >
                <div className="text-3xl mb-3">{m.icon}</div>
                <h3 className="text-base font-bold text-white mb-1">{m.title}</h3>
                <p className="text-sm text-[#71717a]">{m.desc}</p>
              </button>
            ))}
          </div>
        )}

        {/* ── Module: Research ── */}
        {activeModule === "research" && (
          <ModulePanel title="📊 市场研究" onBack={resetModule}>
            <Label>选择行业</Label>
            <Grid>
              {INDUSTRIES.map((ind) => (
                <Chip key={ind} selected={industry === ind} onClick={() => { setIndustry(ind); if (ind !== "✏️ 其他（自定义）") setCustomIndustry("") }}>
                  {ind}
                </Chip>
              ))}
              <Chip selected={industry === "✏️ 其他（自定义）"} onClick={() => setIndustry("✏️ 其他（自定义）")}>
                ✏️ 其他（自定义）
              </Chip>
            </Grid>
            {industry === "✏️ 其他（自定义）" && (
              <input
                value={customIndustry}
                onChange={(e) => setCustomIndustry(e.target.value)}
                placeholder="输入行业名称..."
                className="w-full mt-3 bg-[#18181b] border border-[#27272a] rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#71717a] focus:outline-none focus:border-[#9FFF00]/50"
              />
            )}
            <div className="mt-6">
              <GenerateBtn onClick={generateResearch} disabled={!getIndustry() || isGenerating} loading={isGenerating} />
            </div>
          </ModulePanel>
        )}

        {/* ── Module: BM ── */}
        {activeModule === "bm" && (
          <ModulePanel title="🎯 商业模式" onBack={resetModule}>
            <Label>行业</Label>
            <Grid cols={3}>
              {["💻 科技/SaaS", "🏥 健康/医疗", "📚 教育/培训", "💰 金融/支付", "🛒 电商/零售", "✏️ 其他"].map((ind) => (
                <Chip key={ind} selected={bmIndustry === ind} onClick={() => setBmIndustry(ind)}>{ind}</Chip>
              ))}
            </Grid>
            {bmIndustry === "✏️ 其他" && (
              <input placeholder="输入行业..." className="w-full mt-3 bg-[#18181b] border border-[#27272a] rounded-xl px-4 py-3 text-sm text-white" />
            )}
            <div className="mt-5">
              <Label>客户类型</Label>
              <div className="flex gap-2">
                {CUSTOMER_TYPES.map((ct) => (
                  <Chip key={ct} selected={customerType === ct} onClick={() => setCustomerType(ct)}>{ct}</Chip>
                ))}
              </div>
            </div>
            <div className="mt-6">
              <GenerateBtn onClick={generateBM} disabled={!bmIndustry || !customerType || isGenerating} loading={isGenerating} />
            </div>
          </ModulePanel>
        )}

        {/* ── Module: Roadmap ── */}
        {activeModule === "roadmap" && (
          <ModulePanel title="🗺️ 启动路线图" onBack={resetModule}>
            <Label>当前阶段</Label>
            <div className="flex gap-2 flex-wrap">
              {STAGES.map((s) => (
                <Chip key={s} selected={stage === s} onClick={() => setStage(s)}>{s}</Chip>
              ))}
            </div>
            <div className="mt-5">
              <Label>时间范围</Label>
              <div className="flex gap-2">
                {TIMELINES.map((t) => (
                  <Chip key={t} selected={timeline === t} onClick={() => setTimeline(t)}>{t}</Chip>
                ))}
              </div>
            </div>
            <div className="mt-6">
              <GenerateBtn onClick={generateRoadmap} disabled={!stage || !timeline || isGenerating} loading={isGenerating} />
            </div>
          </ModulePanel>
        )}

        {/* ── Module: Idea ── */}
        {activeModule === "idea" && (
          <ModulePanel title="💡 创意验证" onBack={resetModule}>
            <Label>领域</Label>
            <Grid cols={4}>
              {IDEA_DOMAINS.map((d) => (
                <Chip key={d} selected={ideaDomain === d} onClick={() => setIdeaDomain(d)}>{d}</Chip>
              ))}
            </Grid>
            <div className="mt-6">
              <GenerateBtn onClick={generateIdea} disabled={!ideaDomain || isGenerating} loading={isGenerating} />
            </div>
          </ModulePanel>
        )}

        {/* ── Result card ── */}
        {result && (
          <div className="mt-8 p-8 rounded-2xl bg-[#18181b] border border-[#27272a]">
            <h2 className="text-xl font-bold text-white mb-4" style={{ fontFamily: "Outfit, sans-serif" }}>{result.title}</h2>
            <div className="text-sm text-[#a1a1aa] leading-relaxed whitespace-pre-wrap">{result.content}</div>
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
            {error}
            <button onClick={() => setError(null)} className="ml-3 underline hover:text-red-300">关闭</button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Sub-components ── */
function ModulePanel({ title, onBack, children }: { title: string; onBack: () => void; children: React.ReactNode }) {
  return (
    <div className="p-8 rounded-2xl bg-[#18181b] border border-[#27272a]">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="text-[#71717a] hover:text-white transition-colors text-sm">← 返回</button>
        <h2 className="text-lg font-bold text-white" style={{ fontFamily: "Outfit, sans-serif" }}>{title}</h2>
      </div>
      {children}
    </div>
  )
}

function Label({ children }: { children: string }) {
  return <div className="text-sm text-[#a1a1aa] mb-2 font-medium">{children}</div>
}

function Grid({ children, cols = 4 }: { children: React.ReactNode; cols?: number }) {
  const colClass = cols === 3 ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2 sm:grid-cols-4"
  return <div className={`grid ${colClass} gap-2`}>{children}</div>
}

function Chip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
        selected
          ? "bg-[#9FFF00]/15 text-[#9FFF00] border border-[#9FFF00]/30"
          : "bg-[#0a0a0f] text-[#a1a1aa] border border-[#27272a] hover:border-[#9FFF00]/20 hover:text-white"
      }`}
    >
      {children}
    </button>
  )
}

function GenerateBtn({ onClick, disabled, loading }: { onClick: () => void; disabled: boolean; loading: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full py-3 rounded-xl bg-[#9FFF00] text-[#0a0a0f] font-bold text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#8ae600] transition-all cursor-pointer"
    >
      {loading ? "生成中..." : "生成 →"}
    </button>
  )
}
