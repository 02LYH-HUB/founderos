import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"

export default async function SignInPage() {
  const { userId } = await auth()
  if (userId) redirect("/dashboard")

  // Redirect to Clerk's hosted sign-in page (no JS CDN needed)
  const signInUrl = new URL("https://humorous-shrimp-99.clerk.accounts.dev/sign-in")
  signInUrl.searchParams.set("redirect_url", process.env.NEXT_PUBLIC_APP_URL || "https://soloforge-three.vercel.app/dashboard")
  redirect(signInUrl.toString())
}
