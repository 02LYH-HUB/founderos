import { prisma } from "@/lib/db"
import { auth } from "@clerk/nextjs/server"

async function ensureUser(userId: string) {
  const existing = await prisma.user.findUnique({ where: { id: userId } })
  if (!existing) {
    // Create a minimal user from Clerk session (email unknown, but works for FK)
    await prisma.user.create({
      data: { id: userId, email: `user_${userId.slice(-8)}@founderos.local` },
    })
  }
}

async function ensureProject(userId: string) {
  await ensureUser(userId)

  let company = await prisma.company.findFirst({ where: { userId } })
  if (!company) {
    company = await prisma.company.create({
      data: { userId, name: "My Company" },
    })
  }

  let project = await prisma.project.findFirst({
    where: { companyId: company.id },
  })
  if (!project) {
    project = await prisma.project.create({
      data: {
        companyId: company.id,
        name: "My Startup",
        description: "My first project — let's build something great.",
      },
    })
  }

  return project
}

export async function GET(req: Request) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const project = await ensureProject(userId)

  const [memoryCount, researchCount, bmCount] = await Promise.all([
    prisma.memory.count({ where: { projectId: project.id } }),
    prisma.researchReport.count({ where: { projectId: project.id } }),
    prisma.businessModel.count({ where: { projectId: project.id } }),
  ])

  return Response.json({
    project: { id: project.id, name: project.name, status: project.status },
    stats: { memoryCount, researchCount, bmVersion: bmCount },
    recentActivity: [],
  })
}
