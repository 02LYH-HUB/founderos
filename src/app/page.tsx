import { SignInButton, SignUpButton } from "@clerk/nextjs"
import { auth } from "@clerk/nextjs/server"
import Link from "next/link"

export default async function Home() {
  const { userId } = await auth()
  const isSignedIn = !!userId

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-8 text-center bg-[#F7F8FB]">
      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-8">
        <span className="w-10 h-10 rounded-[11px] bg-[#111] text-[#9FFF00] text-lg font-extrabold grid place-items-center leading-none">
          OS
        </span>
        <span
          className="text-2xl font-bold text-[#111] tracking-tight"
          style={{ fontFamily: "var(--font-outfit)" }}
        >
          FounderOS
        </span>
      </div>

      {/* Headline */}
      <h1
        className="text-4xl sm:text-5xl font-black tracking-[-0.03em] leading-[1.05] text-[#111] mb-4 max-w-2xl"
        style={{ fontFamily: "var(--font-outfit)" }}
      >
        {isSignedIn ? "Welcome back." : "Build a company. One person. One AI partner."}
      </h1>

      <p className="text-lg text-[#6B7280] max-w-lg mb-10 leading-relaxed">
        {isSignedIn
          ? "Pick up where you left off, or start something new."
          : "The operating system for solo founders. Remember everything, research anything, and execute with full context."}
      </p>

      {/* Auth / CTA */}
      {isSignedIn ? (
        <Link href="/dashboard">
          <button className="text-sm font-semibold px-8 py-3.5 rounded-xl bg-[#111] text-white hover:bg-[#2a2a2a] transition-all shadow-[0_2px_12px_rgba(0,0,0,0.1)] cursor-pointer">
            Go to Dashboard →
          </button>
        </Link>
      ) : (
        <div className="flex items-center gap-4">
          <SignInButton mode="modal">
            <button className="text-sm font-medium px-6 py-3 rounded-xl bg-white border border-[#e5e7eb] text-[#111] hover:bg-[#f9fafb] transition-all shadow-sm cursor-pointer">
              Sign In
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className="text-sm font-semibold px-6 py-3 rounded-xl bg-[#111] text-white hover:bg-[#2a2a2a] transition-all shadow-[0_2px_12px_rgba(0,0,0,0.1)] cursor-pointer">
              Get Started
            </button>
          </SignUpButton>
        </div>
      )}
    </div>
  )
}
