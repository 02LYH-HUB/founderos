import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"

export default async function SignUpPage() {
  const { userId } = await auth()
  if (userId) redirect("/dashboard")

  const signUpUrl = new URL("https://humorous-shrimp-99.clerk.accounts.dev/sign-up")
  signUpUrl.searchParams.set("redirect_url", process.env.NEXT_PUBLIC_APP_URL || "https://soloforge-three.vercel.app/dashboard")
  redirect(signUpUrl.toString())
}
