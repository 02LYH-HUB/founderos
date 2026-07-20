import { clerkMiddleware } from "@clerk/nextjs/server"

export default clerkMiddleware(async (auth, req) => {
  // Protect all pages except public routes
  const url = new URL(req.url)
  const isPublic = ["/", "/sign-in", "/sign-up", "/api/webhooks/clerk"].some(p => url.pathname.startsWith(p))
  if (!isPublic) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}
