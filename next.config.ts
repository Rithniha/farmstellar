import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // prefer modern formats to save bandwidth on capable devices
    formats: ["image/avif", "image/webp"],
    // allow Next to optimize images where used
    minimumCacheTTL: 60,
  },
  // Add a small headers config to encourage SW scope and cross-platform behavior
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Service-Worker-Allowed", value: "/" },
          { key: "Cross-Origin-Embedder-Policy", value: "" },
        ],
      },
    ];
  },

  // Development-only rewrites to proxy API calls to the local Express server
  async rewrites() {
    const devProxy = process.env.NODE_ENV === "development";
    return devProxy
      ? [
          {
            source: "/api/:path*",
            destination: "http://localhost:4000/api/:path*",
          },
        ]
      : [];
  },
};

export default nextConfig;
