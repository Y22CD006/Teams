import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["buffalo-squid-jingling.ngrok-free.dev"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "img.clerk.com" },
      { protocol: "https", hostname: "utfs.io" },
    ],
  },
};

export default nextConfig;
