/**
 * AI PM Agent — Extracts executable tasks from roadmap and manages todo list
 */

import { prisma } from "@/lib/db"
import { auth } from "@clerk/nextjs/server"

interface PMTask {
  id: string; title: string; done: boolean; phase: string; priority: string
}

export async function GET() {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const company = await prisma.company.findFirst({ where: { userId } })
  if (!company) return Response.json({ tasks: [], progress: 0 })
  const project = await prisma.project.findFirst({ where: { companyId: company.id } })
  if (!project) return Response.json({ tasks: [], progress: 0 })

  const roadmap = await prisma.roadmap.findFirst({
    where: { projectId: project.id }, orderBy: { createdAt: "desc" },
  })
  if (!roadmap) return Response.json({ tasks: [], progress: 0 })

  const phases = (roadmap.phases as any[]) || []
  // Read from _completedTasks inside phases JSON (where POST writes it)
  const completedIds: string[] = ((roadmap.phases as any)?._completedTasks as string[]) || []

  const tasks: PMTask[] = []
  phases.forEach((phase) => {
    (typeof phase === "object" ? (phase.tasks || []) : []).forEach((task: any, j: number) => {
      const id = `${phase.name}-${j}`
      tasks.push({ id, title: task.title, done: completedIds.includes(id), phase: phase.name, priority: task.priority || "medium" })
    })
  })

  const doneCount = tasks.filter(t => t.done).length
  const progress = tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0

  return Response.json({ tasks, progress })
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { taskId, done } = await req.json()
  if (!taskId) return Response.json({ error: "Missing taskId" }, { status: 400 })

  const company = await prisma.company.findFirst({ where: { userId } })
  if (!company) return Response.json({ error: "No project" }, { status: 404 })
  const project = await prisma.project.findFirst({ where: { companyId: company.id } })
  if (!project) return Response.json({ error: "No project" }, { status: 404 })

  const roadmap = await prisma.roadmap.findFirst({
    where: { projectId: project.id }, orderBy: { createdAt: "desc" },
  })
  if (!roadmap) return Response.json({ error: "No roadmap" }, { status: 404 })

  const phases = (roadmap.phases as any) || {}
  const completedIds: string[] = (phases._completedTasks as string[]) || []
  if (done) {
    if (!completedIds.includes(taskId)) completedIds.push(taskId)
  } else {
    const idx = completedIds.indexOf(taskId)
    if (idx >= 0) completedIds.splice(idx, 1)
  }

  await prisma.roadmap.update({
    where: { id: roadmap.id },
    data: { phases: { ...phases, _completedTasks: completedIds } as any },
  })

  return Response.json({ ok: true })
}
