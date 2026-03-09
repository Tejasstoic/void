import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: false,
  },
  images: {
    remotePatterns: [
      { protocol: "https" as const, hostname: "void-backend-kia3.onrender.com" },
    ],
  },
};

export default nextConfig;
