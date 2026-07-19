"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"

/* ─────────────────────────────────────
   Design DNA: FounderOS
   — Accent: #9FFF00 (lime)
   — Type: Outfit headings / Inter body
   — No AI tropes, no equal-weight cards
   ───────────────────────────────────── */

function Navbar({ scrolled }: { scrolled: boolean }) {
  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? "bg-[#F7F8FB]/80 backdrop-blur-xl border-b border-[#e5e7eb]/50" : ""
    }`}>
      <div className="max-w-7xl mx-auto px-8 h-18 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 font-outfit text-lg font-bold text-[#111] tracking-tight" style={{ fontFamily: "var(--font-outfit)" }}>
          <span className="w-7.5 h-7.5 rounded-[9px] bg-[#111] text-[#9FFF00] text-[13px] font-extrabold grid place-items-center leading-none">OS</span>
          FounderOS
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/sign-in" className="text-sm font-medium text-[#6B7280] hover:text-[#111] transition-colors">Sign In</Link>
          <Link href="/sign-up" className="text-sm font-semibold px-4 py-2 rounded-xl bg-[#111] text-white hover:bg-[#2a2a2a] transition-all shadow-[0_2px_8px_rgba(0,0,0,0.08)]">Get Started</Link>
        </div>
      </div>
    </nav>
  )
}

function TextReveal({ text, className, delay = 0 }: { text: string; className?: string; delay?: number }) {
  return (
    <span className={className}>
      {text.split(" ").map((word, i) => (
        <motion.span key={i} className="inline-block mr-[0.25em]"
          initial={{ opacity: 0, y: 24, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.6, delay: delay + i * 0.05, ease: [0.25, 0.46, 0.45, 0.94] }}>
          {word}
        </motion.span>
      ))}
    </span>
  )
}

function Hero() {
  return (
    <section className="relative min-h-screen flex items-center pt-18 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] left-[-10%] w-[700px] h-[700px] rounded-full blur-[140px] bg-[#9FFF00]/10 animate-[float_24s_ease-in-out_infinite]" />
        <div className="absolute top-[50%] right-[-15%] w-[550px] h-[550px] rounded-full blur-[120px] bg-[#c8dcff]/12 animate-[float_20s_ease-in-out_infinite_3s]" />
        <div className="absolute bottom-[-10%] left-[40%] w-[400px] h-[400px] rounded-full blur-[100px] bg-[#9FFF00]/6 animate-[float_22s_ease-in-out_infinite_6s]" />
      </div>
      <div className="relative z-10 w-full max-w-6xl mx-auto px-8 lg:px-16">
        <div className="max-w-3xl">
          <motion.div className="inline-flex items-center gap-2 mb-12" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="text-xs font-semibold text-[#6B7280] tracking-[0.15em] uppercase">AI Operating System</span>
            <span className="w-4 h-px bg-[#d1d5db]" />
            <span className="text-xs font-medium text-[#9ca3af]">For Solo Founders</span>
          </motion.div>
          <h1 className="font-outfit text-[clamp(3rem,7vw,6.5rem)] font-black tracking-[-0.03em] leading-[0.95] text-[#111] mb-8" style={{ fontFamily: "var(--font-outfit)" }}>
            <TextReveal text="Build a company." />
            <br />
            <TextReveal text="One person. One AI partner." delay={0.35} />
          </h1>
          <motion.div className="text-lg sm:text-xl text-[#6B7280] leading-relaxed mb-12 space-y-1.5" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.8 }}>
            <p>Remembers your business.</p><p>Understands your context.</p><p>Plans your next move.</p><p>Helps you execute.</p>
          </motion.div>
          <motion.div className="flex items-center gap-4" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 1.1 }}>
            <Link href="/sign-up" className="text-base font-semibold px-8 py-4 rounded-2xl bg-[#111] text-white hover:bg-[#2a2a2a] transition-all shadow-[0_4px_20px_rgba(0,0,0,0.1)]">Start Building</Link>
            <a href="#features" className="text-base font-medium px-8 py-4 rounded-2xl text-[#111] hover:bg-black/3 transition-all">See Features ↓</a>
          </motion.div>
        </div>
      </div>
      <style>{`@keyframes float{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(30px,-30px) scale(1.05)}66%{transform:translate(-20px,20px) scale(.95)}}`}</style>
    </section>
  )
}

function FeatureRow({ number, label, title, description, items, side }: { number: string; label: string; title: string; description: string; items: string[]; side: "left" | "right" }) {
  return (
    <motion.div className={`flex flex-col ${side === "right" ? "lg:flex-row-reverse" : "lg:flex-row"} gap-16 lg:gap-24 items-center py-24 lg:py-32`}
      initial={{ opacity: 0, y: 60 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
      <div className="lg:w-[120px] flex-shrink-0">
        <div className="text-xs font-bold text-[#9ca3af] tracking-[0.2em] uppercase mb-2">{label}</div>
        <div className="font-outfit text-7xl sm:text-8xl font-black text-[#e5e7eb] leading-none" style={{ fontFamily: "var(--font-outfit)" }}>{number}</div>
      </div>
      <div className="flex-1 max-w-xl">
        <h2 className="font-outfit text-2xl sm:text-3xl font-bold text-[#111] mb-4" style={{ fontFamily: "var(--font-outfit)" }}>{title}</h2>
        <p className="text-base text-[#6B7280] leading-relaxed mb-8">{description}</p>
        <div className="flex flex-wrap gap-2">
          {items.map((item) => <span key={item} className="text-[13px] font-medium px-3.5 py-2 rounded-xl bg-white border border-[#e5e7eb] text-[#111]">{item}</span>)}
        </div>
      </div>
      <div className="hidden lg:block flex-1 max-w-[320px]">
        <div className="aspect-square rounded-[32px] bg-[#111]/[0.02] border border-[#e5e7eb] flex items-center justify-center">
          <div className="w-2/3 h-2/3 rounded-2xl bg-gradient-to-br from-[#9FFF00]/15 to-transparent relative">
            <div className="absolute bottom-4 left-4 right-4 h-1/3 rounded-xl bg-white/80 border border-[#e5e7eb]/50" />
          </div>
        </div>
      </div>
    </motion.div>
  )
}

const TARGET_USERS = [
  { emoji: "🚀", title: "Solo Founders", desc: "Building a company alone. Need a partner that remembers everything and pushes you forward." },
  { emoji: "💻", title: "Indie Developers", desc: "You can code, but business strategy isn't your thing. Your AI partner fills the gap." },
  { emoji: "🏗️", title: "Side-Project Builders", desc: "Validating an idea while working full-time. Get structured guidance without hiring a team." },
  { emoji: "💡", title: "First-Time Founders", desc: "You have the vision but don't know the playbook. Your AI partner walks you through every step." },
  { emoji: "🌏", title: "Global Creators", desc: "Building across borders. Market research, pricing, and launch strategies for any region." },
  { emoji: "⚡", title: "Small Teams", desc: "2-5 people doing the work of 20. One shared AI partner for strategy, research, and execution." },
]

const AGENTS = [
  { label: "AI CEO", desc: "Vision, strategy, decisions", color: "#9FFF00" },
  { label: "AI PM", desc: "Roadmaps, specs, prioritization", color: "#60a5fa" },
  { label: "AI Engineer", desc: "Code, architecture, debugging", color: "#a78bfa" },
  { label: "AI Marketing", desc: "Campaigns, SEO, content", color: "#f472b6" },
  { label: "AI Designer", desc: "UI, brand, design systems", color: "#fb923c" },
  { label: "AI Finance", desc: "Pricing, projections, unit economics", color: "#2dd4bf" },
]

export default function HomePage() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <div className="min-h-screen bg-[#F7F8FB] selection:bg-[#9FFF00] selection:text-[#111]" style={{ fontFamily: "var(--font-outfit)" }}>
      <Navbar scrolled={scrolled} />
      <Hero />

      <section id="features" className="px-8">
        <div className="max-w-6xl mx-auto">
          <FeatureRow number="01" label="Ideas" title="AI Idea Engine" description="Describe your vision, and your AI partner generates structured business ideas, market angles, and validation questions." items={["Idea Generation", "Validation", "Market Fit", "Pitch Decks", "Competitor Landscape"]} side="left" />
          <FeatureRow number="02" label="Research" title="AI Market Research" description="Real-time market analysis. SWOT, competitor breakdowns, pricing strategies, and user personas — in minutes." items={["Market Sizing", "SWOT Analysis", "Competitor Intel", "User Personas", "Trend Reports"]} side="right" />
          <FeatureRow number="03" label="Roadmap" title="AI Startup Roadmap" description="From MVP to scale — a phased roadmap, task breakdowns, and marketing plans. Connected to your business context." items={["Business Canvas", "Phased Roadmap", "Task Breakdown", "Marketing Plans", "Revenue Models"]} side="left" />
        </div>
      </section>

      <section className="py-24 px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div className="mb-14" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <p className="text-xs font-bold text-[#9ca3af] tracking-[0.2em] uppercase mb-4">Built For</p>
            <h2 className="font-outfit text-3xl sm:text-4xl font-bold text-[#111]" style={{ fontFamily: "var(--font-outfit)" }}>One person.<br /><span className="text-[#6B7280]">One AI partner. Infinite possibilities.</span></h2>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {TARGET_USERS.map((u, i) => (
              <motion.div key={u.title} className="p-6 rounded-2xl bg-white border border-[#e5e7eb] hover:shadow-sm transition-all"
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.06 }}>
                <div className="text-2xl mb-3">{u.emoji}</div>
                <h3 className="font-outfit text-base font-bold text-[#111] mb-1.5" style={{ fontFamily: "var(--font-outfit)" }}>{u.title}</h3>
                <p className="text-sm text-[#6B7280] leading-relaxed">{u.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <div className="py-24 px-8">
        <div className="max-w-3xl mx-auto">
          <motion.blockquote className="font-outfit text-3xl sm:text-4xl font-bold text-[#111] leading-snug text-center" style={{ fontFamily: "var(--font-outfit)" }}
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            "The best co-founder <span className="text-[#9FFF00] bg-[#111] px-2 py-0.5 rounded-lg">never sleeps</span>, never forgets, and costs less than <span className="line-through decoration-[#6B7280] decoration-2">a salary</span>."
          </motion.blockquote>
        </div>
      </div>

      <section className="py-24 px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div className="mb-16" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <p className="text-xs font-bold text-[#9ca3af] tracking-[0.2em] uppercase mb-4">Coming Soon</p>
            <h2 className="font-outfit text-4xl sm:text-5xl font-bold text-[#111] mb-4" style={{ fontFamily: "var(--font-outfit)" }}>Every role. One OS.</h2>
            <p className="text-lg text-[#6B7280] max-w-lg">Specialized AI agents, connected through a shared memory layer.</p>
          </motion.div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {AGENTS.map((a, i) => (
              <motion.div key={a.label} className="group relative p-6 rounded-2xl border border-[#e5e7eb] bg-white/60 backdrop-blur-sm cursor-default overflow-hidden"
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.06 }}
                whileHover={{ y: -4, boxShadow: "0 8px 30px rgba(0,0,0,0.05)", borderColor: a.color + "40" }}>
                <div className="absolute top-0 left-0 w-full h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: a.color }} />
                <h3 className="font-outfit text-sm font-bold text-[#111] mb-1.5" style={{ fontFamily: "var(--font-outfit)" }}>{a.label}</h3>
                <p className="text-xs text-[#9ca3af] leading-relaxed">{a.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-32 px-8 text-center">
        <motion.div className="max-w-lg mx-auto" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="font-outfit text-3xl sm:text-4xl font-bold text-[#111] mb-4" style={{ fontFamily: "var(--font-outfit)" }}>Start building today.</h2>
          <p className="text-base text-[#6B7280] mb-10">Free to start. No credit card.</p>
          <Link href="/sign-up" className="inline-flex text-base font-semibold px-10 py-4 rounded-2xl bg-[#111] text-white hover:bg-[#2a2a2a] transition-all shadow-[0_4px_20px_rgba(0,0,0,0.1)]">Get Started</Link>
        </motion.div>
      </section>

      <footer className="border-t border-[#e5e7eb] py-16 px-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-sm text-[#6B7280]">
          <div className="flex items-center gap-3">
            <span className="w-6 h-6 rounded-[7px] bg-[#111] text-[#9FFF00] text-[10px] font-extrabold grid place-items-center leading-none">OS</span>
            <span className="text-[#111] font-medium">FounderOS</span>
          </div>
          <div className="flex items-center gap-8">
            {["Product", "Resources", "Privacy", "Terms", "GitHub"].map((l) => <a key={l} href="#" className="hover:text-[#111] transition-colors">{l}</a>)}
          </div>
          <span className="text-[#9ca3af]">© 2026 FounderOS</span>
        </div>
      </footer>
    </div>
  )
}
