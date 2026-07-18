"use client"
import { UserButton, useUser } from "@clerk/nextjs"
import Link from "next/link"
import { usePathname } from "next/navigation"

const NAV_ITEMS = [
  { label: "AI Co-founder", href: "/chat", icon: "💬" },
  { label: "Dashboard", href: "/dashboard", icon: "📊" },
  { label: "Memory", href: "/memory", icon: "🧠" },
  { label: "Research", href: "/research", icon: "📈" },
  { label: "Business Model", href: "/business-model", icon: "🎯" },
  { label: "Roadmap", href: "/roadmap", icon: "🗺️" },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user } = useUser()
  const userName = user?.firstName || user?.emailAddresses?.[0]?.emailAddress?.split("@")[0] || "Founder"

  return (
    <aside className="w-60 border-r border-[#1a1a2e] bg-[#0d0d15] flex flex-col">
      <Link href="/dashboard" className="flex items-center gap-2.5 px-5 py-4 border-b border-[#1a1a2e]">
        <span className="w-7 h-7 rounded-[8px] bg-[#9FFF00] text-[#0a0a0f] text-xs font-extrabold grid place-items-center leading-none">
          OS
        </span>
        <span className="font-bold text-white text-sm tracking-tight" style={{ fontFamily: "Outfit, sans-serif" }}>
          FounderOS
        </span>
      </Link>
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                active ? "text-[#9FFF00] bg-[#9FFF00]/10" : "text-[#a1a1aa] hover:text-white hover:bg-[#1a1a2e]"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="px-5 py-4 border-t border-[#1a1a2e] flex items-center justify-between">
        <span className="text-sm text-[#71717a] truncate">{userName}</span>
        <UserButton />
      </div>
    </aside>
  )
}
