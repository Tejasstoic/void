import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      { protocol: "https" as const, hostname: "void-backend-kia3.onrender.com" },
    ],
  },
};

export default nextConfig;
