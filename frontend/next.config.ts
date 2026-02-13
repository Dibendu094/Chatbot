import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false, // Helps with WebSockets/Voice Mode in dev (prevents double mount)
  typescript: {
    ignoreBuildErrors: true,
  }
};

export default nextConfig;
