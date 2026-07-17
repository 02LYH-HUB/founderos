import { Webhook } from "svix"
import { headers } from "next/headers"
import { prisma } from "@/lib/db"

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET || ""

export async function POST(req: Request) {
  const headerPayload = await headers()
  const svixId = headerPayload.get("svix-id")
  const svixTimestamp = headerPayload.get("svix-timestamp")
  const svixSignature = headerPayload.get("svix-signature")

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing svix headers", { status: 400 })
  }

  const body = await req.text()
  let event: { type: string; data: Record<string, unknown> }

  try {
    const wh = new Webhook(webhookSecret)
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as { type: string; data: Record<string, unknown> }
  } catch {
    return new Response("Invalid signature", { status: 400 })
  }

  const { type, data } = event

  switch (type) {
    case "user.created": {
      const userId = data.id as string
      const email = (data.email_addresses as Array<{ email_address: string }>)?.[0]?.email_address
      const name = `${data.first_name || ""} ${data.last_name || ""}`.trim() || null

      if (!userId || !email) {
        return new Response("Missing user data", { status: 400 })
      }

      // Upsert user
      await prisma.user.upsert({
        where: { id: userId },
        create: {
          id: userId,
          email,
          name,
        },
        update: { email, name },
      })

      // Auto-create company if none exists
      const existingCompany = await prisma.company.findFirst({
        where: { userId },
      })

      if (!existingCompany) {
        const company = await prisma.company.create({
          data: {
            userId,
            name: name ? `${name}'s Company` : "My Company",
          },
        })

        // Auto-create first project
        await prisma.project.create({
          data: {
            companyId: company.id,
            name: "My Startup",
            description: "My first project — let's build something great.",
          },
        })
      }

      break
    }

    case "user.updated": {
      const userId = data.id as string
      const email = (data.email_addresses as Array<{ email_address: string }>)?.[0]?.email_address
      const name = `${data.first_name || ""} ${data.last_name || ""}`.trim() || null

      await prisma.user.update({
        where: { id: userId },
        data: { email, name },
      })
      break
    }

    case "user.deleted": {
      await prisma.user.delete({ where: { id: data.id as string } })
      break
    }
  }

  return new Response("OK", { status: 200 })
}
