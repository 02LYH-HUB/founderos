"use client"

import { useState, useEffect } from "react"

interface Task {
  id: string; title: string; done: boolean; phase: string; priority: string
}

export default function PMTodoList() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [progress, setProgress] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/pm-agent")
      .then(async r => { try { return await r.json() } catch { return {} } })
      .then(d => { setTasks(d.tasks || []); setProgress(d.progress || 0) })
      .finally(() => setLoading(false))
  }, [])

  async function toggleTask(id: string, currentDone: boolean) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !currentDone } : t))
    const newDone = tasks.filter(t => t.done !== (t.id === id ? !currentDone : t.done) ? false : true).length + (!currentDone ? 1 : 0)
    const newProgress = tasks.length > 0 ? Math.round((newDone / tasks.length) * 100) : 0
    setProgress(newProgress)

    await fetch("/api/pm-agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId: id, done: !currentDone }),
    })
  }

  if (loading) return <div className="text-sm text-[#71717a] animate-pulse">Loading tasks...</div>

  if (tasks.length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-[#18181b] border border-[#27272a] text-center">
        <div className="text-3xl mb-3">🗺️</div>
        <h3 className="text-sm font-bold text-white mb-1">No roadmap yet</h3>
        <p className="text-xs text-[#71717a]">Generate a startup roadmap to see your task list here.</p>
      </div>
    )
  }

  return (
    <div className="p-6 rounded-2xl bg-[#18181b] border border-[#27272a]">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          🤖 AI PM — Task Board
        </h2>
        <span className="text-xs text-[#71717a]">{progress}% complete</span>
      </div>

      {/* Progress bar */}
      <div className="mb-5 h-1.5 bg-[#27272a] rounded-full overflow-hidden">
        <div className="h-full bg-[#9FFF00] rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      {/* Task list grouped by phase */}
      {Array.from(new Set(tasks.map(t => t.phase))).map(phase => (
        <div key={phase} className="mb-4 last:mb-0">
          <p className="text-[10px] text-[#71717a] uppercase tracking-wide mb-2">{phase}</p>
          {tasks.filter(t => t.phase === phase).map(task => (
            <button
              key={task.id}
              onClick={() => toggleTask(task.id, task.done)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all cursor-pointer mb-1 ${
                task.done ? "opacity-40" : "hover:bg-[#27272a]/50"
              }`}
            >
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                task.done ? "bg-[#9FFF00] border-[#9FFF00]" : "border-[#3f3f46] hover:border-[#9FFF00]/50"
              }`}>
                {task.done && <span className="text-[10px] text-[#0a0a0f] font-bold">✓</span>}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${task.done ? "text-[#71717a] line-through" : "text-[#e4e4e7]"}`}>{task.title}</p>
              </div>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-lg ${
                task.priority === "high" ? "text-red-400 bg-red-400/10"
                : task.priority === "critical" ? "text-red-400 bg-red-400/10"
                : "text-[#71717a] bg-[#27272a]"
              }`}>{task.priority}</span>
            </button>
          ))}
        </div>
      ))}
    </div>
  )
}
