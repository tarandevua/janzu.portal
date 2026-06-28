import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "32mb",
    },
  },
  typedRoutes: true
};

export default nextConfig;
