import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev server blocks /_next assets for non-localhost hosts; without this the LAN page never hydrates.
  allowedDevOrigins: ["192.168.100.144"],
};

export default nextConfig;
