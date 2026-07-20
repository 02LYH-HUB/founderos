import { SignUp } from "@clerk/nextjs"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

export default async function SignUpPage() {
  const { userId } = await auth()
  if (userId) redirect("/dashboard")

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0a0a0f]">
      <SignUp routing="hash" />
    </div>
  )
}
