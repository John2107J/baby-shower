import type { NextConfig } from "next";
import { buildSecurityHeaders } from "./src/lib/security-headers";

const isDevelopment = process.env.NODE_ENV !== "production";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:path*", headers: buildSecurityHeaders(isDevelopment) },
    ];
  },
};

export default nextConfig;
