"use client"
import { UserButton, useUser } from "@clerk/nextjs"
import Link from "next/link"
import { usePathname } from "next/navigation"
import QueryProvider from "@/components/QueryProvider"

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: "📊" },
  { label: "AI Co-founder", href: "/chat", icon: "💬" },
  { label: "Memory", href: "/memory", icon: "🧠" },
  { label: "Research", href: "/research", icon: "📈" },
  { label: "Business Model", href: "/business-model", icon: "🎯" },
  { label: "Roadmap", href: "/roadmap", icon: "🗺️" },
]

function SidebarInner() {
  const pathname = usePathname()
  const { user } = useUser()

  return (
    <aside className="w-56 bg-[#0a0a0f] border-r border-[#1a1a2e] h-screen flex flex-col p-4">
      <Link href="/dashboard" className="mb-8 text-lg font-bold text-white tracking-tight" style={{ fontFamily: "Outfit, sans-serif" }}>OS FounderOS</Link>
      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all ${
                isActive ? "bg-[#9FFF00]/10 text-[#9FFF00] font-semibold" : "text-[#a1a1aa] hover:text-white hover:bg-[#18181b]"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="pt-4 border-t border-[#1a1a2e]">
        <div className="flex items-center gap-2 px-3 py-2">
          <UserButton />
          <span className="text-xs text-[#a1a1aa] truncate">{user?.firstName || "User"}</span>
        </div>
      </div>
    </aside>
  )
}

export default function Sidebar() {
  return (
    <QueryProvider>
      <SidebarInner />
    </QueryProvider>
  )
}
