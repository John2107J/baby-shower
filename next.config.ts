import type { NextConfig } from "next";
import { buildSecurityHeaders } from "./src/lib/security-headers";

const isDevelopment = process.env.NODE_ENV !== "production";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: {
    serverActions: {
      // 4 MB photo (decision 21) plus form overhead; Vercel rejects bodies over 4.5 MB.
      bodySizeLimit: "4.5mb",
    },
  },
  // Fonts read from disk by the link-preview image must ship with the function.
  outputFileTracingIncludes: {
    "/i/[token]/opengraph-image": ["./src/assets/fonts/**"],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
  async headers() {
    return [
      { source: "/:path*", headers: buildSecurityHeaders(isDevelopment) },
    ];
  },
};

export default nextConfig;
