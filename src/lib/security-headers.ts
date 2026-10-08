export type SecurityHeader = { key: string; value: string };

const TWO_YEARS_IN_SECONDS = 63_072_000;

export const CONTENT_SECURITY_POLICY = "Content-Security-Policy";

export const VERCEL_BLOB_HOST_PATTERN =
  "https://*.public.blob.vercel-storage.com";

const NONCE_BYTES = 16;

/** Fresh, unpredictable value for each response (128 bits from the CSPRNG). */
export function generateCspNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(NONCE_BYTES));
  return btoa(String.fromCharCode(...bytes));
}

/**
 * Scripts run only with this response's nonce, which Next.js adds to its own
 * scripts ('strict-dynamic' lets those load the page's bundles). React's dev
 * tooling additionally needs 'unsafe-eval', only in development.
 */
export function buildContentSecurityPolicy({
  isDevelopment,
  nonce,
}: {
  isDevelopment: boolean;
  nonce: string;
}): string {
  const scriptSrc = [
    "'self'",
    `'nonce-${nonce}'`,
    "'strict-dynamic'",
    ...(isDevelopment ? ["'unsafe-eval'"] : []),
  ];

  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": scriptSrc,
    // Inline styles stay allowed: the pages use style attributes (progress
    // bars, animations). Styles cannot run code, so the risk is low.
    "style-src": ["'self'", "'unsafe-inline'"],
    // Gift photos are served from Vercel Blob (decision 21).
    "img-src": ["'self'", "data:", "blob:", VERCEL_BLOB_HOST_PATTERN],
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

/** Headers that are the same on every response. The CSP is set per request in src/proxy.ts. */
export function buildSecurityHeaders(): SecurityHeader[] {
  return [
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
