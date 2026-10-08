import { type NextRequest, NextResponse } from "next/server";
import {
  CONTENT_SECURITY_POLICY,
  buildContentSecurityPolicy,
  generateCspNonce,
} from "@/lib/security-headers";

/**
 * Nonce-based CSP (phase 7): every page gets a new nonce. Next.js reads it
 * from the request's CSP header and adds it to its scripts; the browser runs
 * only scripts carrying it.
 */
export function proxy(request: NextRequest) {
  const policy = buildContentSecurityPolicy({
    isDevelopment: process.env.NODE_ENV !== "production",
    nonce: generateCspNonce(),
  });
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(CONTENT_SECURITY_POLICY, policy);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set(CONTENT_SECURITY_POLICY, policy);
  return response;
}

export const config = {
  matcher: [
    {
      // Pages only: API routes, static files and image optimization run no page scripts.
      source: "/((?!api/|_next/static/|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
