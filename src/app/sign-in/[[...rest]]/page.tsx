import { SignIn } from "@clerk/nextjs"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

export default async function SignInPage(props: { searchParams?: Promise<{ registered?: string }> }) {
  const { userId } = await auth()
  if (userId) redirect("/dashboard")

  const searchParams = await props.searchParams
  const justRegistered = searchParams?.registered === "true"

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0a0a0f]">
      <div className="w-full max-w-md">
        {justRegistered && (
          <div className="mb-6 p-4 rounded-xl bg-[#9FFF00]/10 border border-[#9FFF00]/30 text-center">
            <p className="text-sm text-[#9FFF00] font-medium">✅ Account created successfully!</p>
            <p className="text-xs text-[#71717a] mt-1">Sign in to continue.</p>
          </div>
        )}
        <SignIn />
      </div>
    </div>
  )
}
