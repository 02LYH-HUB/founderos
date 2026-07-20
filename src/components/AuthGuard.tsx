"use client"

import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function AuthGuard({
  children,
  label = "Sign in to use this feature",
}: {
  children: React.ReactNode
  label?: string
}) {
  const { isSignedIn, isLoaded } = useUser()
  const router = useRouter()
  const [showPrompt, setShowPrompt] = useState(false)

  function handleAction(e: React.MouseEvent) {
    if (!isLoaded) return
    if (!isSignedIn) {
      e.preventDefault()
      setShowPrompt(true)
    }
  }

  return (
    <>
      <div onClick={handleAction} className="inline-block">
        {children}
      </div>

      {showPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowPrompt(false)}>
          <div className="mx-4 p-8 rounded-2xl bg-[#18181b] border border-[#27272a] max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <div className="text-3xl mb-4">🚀</div>
            <h3 className="text-lg font-bold text-white mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>Sign in to continue</h3>
            <p className="text-sm text-[#a1a1aa] mb-6">Sign in or create an account — 60 seconds to your first startup plan.</p>
            <button onClick={() => { router.push("/sign-in"); setShowPrompt(false) }}
              className="w-full mb-2 py-3 rounded-xl bg-[#9FFF00] text-[#0a0a0f] font-bold text-sm hover:bg-[#8ae600] transition-all cursor-pointer">
              Sign In →
            </button>
            <button onClick={() => { router.push("/sign-up"); setShowPrompt(false) }}
              className="w-full py-3 rounded-xl border border-[#27272a] text-white font-medium text-sm hover:bg-[#27272a] transition-all cursor-pointer">
              Create Account
            </button>
          </div>
        </div>
      )}
    </>
  )
}
