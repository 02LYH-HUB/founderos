import { SignUp } from "@clerk/nextjs"

export default function Page() {
  return (
    <div className="relative min-h-screen bg-[#0a0a0f] flex items-center justify-center overflow-hidden">
      {/* Tech grid */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(#9FFF00 1px, transparent 1px), linear-gradient(90deg, #9FFF00 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(ellipse at center, black 30%, transparent 70%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, black 30%, transparent 70%)",
        }}
      />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[#9FFF00]/[0.03] blur-[100px]" />

      <div className="relative w-full max-w-md px-4">
        <div className="text-center mb-8">
          <div className="w-10 h-10 rounded-[10px] bg-[#9FFF00] text-[#0a0a0f] text-lg font-extrabold grid place-items-center mx-auto mb-4">OS</div>
          <h1 className="text-lg font-bold text-white" style={{ fontFamily: "Outfit, sans-serif" }}>FounderOS</h1>
          <p className="text-xs text-[#71717a] mt-1">Your AI co-founder</p>
        </div>
        <SignUp fallbackRedirectUrl="/sign-in?registered=true" />
      </div>
    </div>
  )
}
