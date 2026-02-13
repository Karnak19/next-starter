import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  cacheComponents: true,
  async rewrites() {
    return [
      {
        source: "/api/pocketbase/:path*",
        destination: `${process.env.POCKETBASE_URL ?? "http://127.0.0.1:8080"}/:path*`,
      },
    ];
  },
};

export default nextConfig;
