import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Phones testing the dev server over a tunnel (camera needs HTTPS) or the LAN.
  allowedDevOrigins: [
    "*.trycloudflare.com",
    "*.ngrok-free.app",
    "*.ngrok.app",
    "*.ngrok.io",
    "192.168.*.*",
    "10.*.*.*",
  ],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Camera only for this site; everything else that's sensitive stays off.
          { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=(), payment=()" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ]
  },
}

export default nextConfig
