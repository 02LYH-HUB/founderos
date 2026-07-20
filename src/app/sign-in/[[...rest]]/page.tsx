import { SignIn } from "@clerk/nextjs"

export default function Page() {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#0a0a0f" }}>
      <SignIn afterSignInUrl="/dashboard" />
    </div>
  )
}
