import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  // Next.js blocks cross-origin requests to dev assets by default. Allow the
  // local network so the dev server can be opened from a phone on the same Wi-Fi.
  allowedDevOrigins: ["192.168.0.4", "192.168.0.*", "192.168.*.*", "10.*.*.*"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
