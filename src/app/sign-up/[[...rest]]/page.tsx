import { SignUp } from "@clerk/nextjs"

export default function Page() {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#0a0a0f" }}>
      <SignUp fallbackRedirectUrl="/sign-in?registered=true" />
    </div>
  )
}
