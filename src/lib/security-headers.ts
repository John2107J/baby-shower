export type SecurityHeader = { key: string; value: string };

const TWO_YEARS_IN_SECONDS = 63_072_000;

export function buildContentSecurityPolicy(isDevelopment: boolean): string {
  // Next.js injects inline bootstrap scripts, so 'unsafe-inline' is required
  // until nonce-based CSP is adopted (planned for the hardening phase).
  // React's dev tooling additionally needs 'unsafe-eval', only in development.
  const scriptSrc = [
    "'self'",
    "'unsafe-inline'",
    ...(isDevelopment ? ["'unsafe-eval'"] : []),
  ];

  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": scriptSrc,
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:"],
    "font-src": ["'self'"],
    "connect-src": ["'self'"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
  };

  const policy = Object.entries(directives).map(
    ([name, values]) => `${name} ${values.join(" ")}`,
  );
  if (!isDevelopment) policy.push("upgrade-insecure-requests");
  return policy.join("; ");
}

export function buildSecurityHeaders(isDevelopment: boolean): SecurityHeader[] {
  return [
    {
      key: "Content-Security-Policy",
      value: buildContentSecurityPolicy(isDevelopment),
    },
    {
      key: "Strict-Transport-Security",
      value: `max-age=${TWO_YEARS_IN_SECONDS}; includeSubDomains`,
    },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "no-referrer" },
    {
      key: "Permissions-Policy",
      value:
        "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
    },
    // Invitation links are private: nothing on this site should be indexed.
    { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
  ];
}
