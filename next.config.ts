import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://clerk.soloforge.cloud https://*.clerk.accounts.dev; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.clerk.accounts.dev; img-src 'self' data: https: https://*.clerk.accounts.dev; font-src 'self' https://fonts.gstatic.com https://*.clerk.accounts.dev; connect-src 'self' https://api.deepseek.com https://open.bigmodel.cn https://*.clerk.accounts.dev https://clerk.soloforge.cloud https://*.supabase.co; frame-src 'self' https://clerk.soloforge.cloud https://*.clerk.accounts.dev; worker-src 'self' blob:" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ]
  },
}

export default nextConfig
