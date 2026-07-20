import { SignUp } from "@clerk/nextjs"

const appearance = {
  elements: {
    card: "bg-transparent shadow-none border border-[#27272a] rounded-2xl p-8",
    headerTitle: "text-white text-xl font-bold",
    headerSubtitle: "text-[#71717a] text-sm",
    socialButtonsBlockButton: "border border-[#27272a] text-white hover:bg-[#27272a] rounded-xl",
    socialButtonsBlockButtonText: "text-white text-sm font-medium",
    dividerLine: "bg-[#27272a]",
    dividerText: "text-[#71717a] text-xs",
    formFieldLabel: "text-[#a1a1aa] text-xs font-medium",
    formFieldInput: "bg-[#0a0a0f] border border-[#27272a] text-white rounded-xl px-3 py-2.5 text-sm focus:border-[#9FFF00]/50",
    formButtonPrimary: "bg-[#9FFF00] text-[#0a0a0f] font-bold rounded-xl hover:bg-[#8ae600] transition-all",
    footerActionText: "text-[#71717a] text-xs",
    footerActionLink: "text-[#9FFF00] text-xs font-medium hover:underline",
    formFieldErrorText: "text-red-400 text-xs",
    alertText: "text-[#a1a1aa] text-xs bg-red-400/10 rounded-xl p-3",
    alertTextDanger: "text-red-400",
  },
}

export default function Page() {
  return (
    <div className="relative min-h-screen bg-[#0a0a0f] flex items-center justify-center overflow-hidden">
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
          <h1 className="text-xl font-bold text-white" style={{ fontFamily: "Outfit, sans-serif" }}>FounderOS</h1>
          <p className="text-sm text-[#71717a] mt-1">Your AI co-founder</p>
        </div>
        <SignUp appearance={appearance} fallbackRedirectUrl="/sign-in?registered=true" />
      </div>
    </div>
  )
}
