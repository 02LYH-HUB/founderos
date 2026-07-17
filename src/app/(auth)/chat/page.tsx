"use client"

import { useState, useRef, useEffect } from "react"

type Message = { role: "user" | "assistant"; content: string }

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [projectId, setProjectId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch("/api/dashboard")
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((data) => {
        if (data.project?.id) setProjectId(data.project.id)
        else setError("No project found. Please refresh.")
      })
      .catch((e) => setError(`Failed to connect: ${e.message}`))
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || !projectId || isLoading) return
    const userMessage = input.trim()
    setInput("")
    setMessages((prev) => [...prev, { role: "user", content: userMessage }])
    setIsLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, message: userMessage }),
      })

      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      const reader = response.body?.getReader()
      if (!reader) throw new Error("No response body")

      const decoder = new TextDecoder()
      let assistantContent = ""
      setMessages((prev) => [...prev, { role: "assistant", content: "" }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        assistantContent += chunk
        setMessages((prev) => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: "assistant", content: assistantContent }
          return updated
        })
      }
    } catch (e: any) {
      setError(`Send failed: ${e.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0f]">
      <div className="px-6 py-4 border-b border-[#1a1a2e]">
        <h1 className="text-lg font-semibold text-white" style={{ fontFamily: "Outfit, sans-serif" }}>
          Founder Chat
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
            {error}
            <button onClick={() => window.location.reload()} className="ml-3 underline hover:text-red-300">
              Retry
            </button>
          </div>
        )}

        {!projectId && !error && (
          <div className="flex items-center justify-center h-full text-[#a1a1aa] text-sm">Loading project...</div>
        )}

        {projectId && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-5xl mb-4">💬</div>
            <h2 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>
              Start a conversation
            </h2>
            <p className="text-sm text-[#a1a1aa] max-w-sm">
              Ask about market research, business models, strategy, or anything about your startup.
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === "assistant" ? "" : "flex-row-reverse"}`}>
            <div className={`w-7 h-7 rounded-lg grid place-items-center text-xs font-bold flex-shrink-0 ${
              msg.role === "assistant" ? "bg-[#9FFF00] text-[#0a0a0f]" : "bg-[#27272a] text-white"
            }`}>
              {msg.role === "assistant" ? "OS" : "U"}
            </div>
            <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              msg.role === "assistant"
                ? "bg-[#18181b] text-[#fafafa] border border-[#27272a]"
                : "bg-[#9FFF00]/10 text-[#e4e4e7] border border-[#9FFF00]/20"
            }`}>
              <div className="whitespace-pre-wrap">
                {msg.content || (isLoading ? "..." : "")}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="px-6 py-4 border-t border-[#1a1a2e]">
        <div className="flex gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage() }
            }}
            placeholder={error ? "Fix the error above first..." : "Ask anything about your business..."}
            rows={1}
            disabled={isLoading || !!error}
            className="flex-1 bg-[#18181b] border border-[#27272a] rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#71717a] resize-none focus:outline-none focus:border-[#9FFF00]/50 transition-all"
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim() || !projectId || !!error}
            className="px-5 py-3 rounded-xl bg-[#9FFF00] text-[#0a0a0f] font-semibold text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#8ae600] transition-all cursor-pointer"
          >
            {isLoading ? "..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  )
}
