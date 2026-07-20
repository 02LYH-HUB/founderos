import { NextRequest } from "next/server"

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`

export async function POST(req: NextRequest) {
  try {
    const update = await req.json()
    const msg = update.message
    if (!msg?.text) return Response.json({ ok: true })

    const chatId = msg.chat.id
    const text = msg.text.trim()
    const user = msg.from?.first_name || "there"

    let reply = ""
    if (text.startsWith("/start")) {
      reply = `👋 Hi ${user}! I'm FounderOS Assistant.\nSend me a startup idea and I'll analyze it.`
    } else if (text === "/plans") {
      reply = "📋 Open FounderOS Dashboard to see your plans: https://soloforge.cloud/dashboard"
    } else if (text.length > 10) {
      // Analyze as startup idea
      reply = `💡 Got it! I've noted your idea:\n\n"${text.slice(0, 200)}"\n\nOpen FounderOS to generate a full plan: https://soloforge.cloud`
    } else {
      reply = `Hi ${user}! Send me your startup idea or use /start to begin.`
    }

    await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: reply }),
    })

    return Response.json({ ok: true })
  } catch {
    return Response.json({ ok: true })
  }
}
