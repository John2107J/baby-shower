import { describe, expect, it } from "vitest";
import {
  buildContentSecurityPolicy,
  buildSecurityHeaders,
  generateCspNonce,
} from "@/lib/security-headers";

const headerValue = (key: string) =>
  buildSecurityHeaders().find((header) => header.key === key)?.value;
const production = (nonce = "abc123") =>
  buildContentSecurityPolicy({ isDevelopment: false, nonce });

describe("buildSecurityHeaders", () => {
  it.each([
    "Strict-Transport-Security",
    "X-Content-Type-Options",
    "Referrer-Policy",
    "Permissions-Policy",
    "X-Robots-Tag",
    "X-Frame-Options",
  ])("includes %s", (key) => {
    expect(headerValue(key)).toBeTruthy();
  });

  it("marks every page as noindex", () => {
    expect(headerValue("X-Robots-Tag")).toContain("noindex");
  });
});

describe("buildContentSecurityPolicy", () => {
  it("runs only scripts carrying this response's nonce", () => {
    expect(production("abc123")).toContain(
      "script-src 'self' 'nonce-abc123' 'strict-dynamic'",
    );
    const scriptSrc = production()
      .split("; ")
      .find((d) => d.startsWith("script-src"));
    expect(scriptSrc).not.toContain("unsafe-inline");
  });

  it("does not allow eval in production, only in development", () => {
    expect(production()).not.toContain("unsafe-eval");
    expect(
      buildContentSecurityPolicy({ isDevelopment: true, nonce: "n" }),
    ).toContain("'unsafe-eval'");
  });

  it("allows images only from the site itself and Vercel Blob", () => {
    expect(production()).toContain(
      "img-src 'self' data: blob: https://*.public.blob.vercel-storage.com",
    );
  });

  it("forbids framing and plugins", () => {
    const policy = production();
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).toContain("object-src 'none'");
  });
});

describe("generateCspNonce", () => {
  it("returns a different 128-bit base64 value each time", () => {
    const nonces = new Set(Array.from({ length: 50 }, generateCspNonce));
    expect(nonces.size).toBe(50);
    for (const nonce of nonces) expect(nonce).toMatch(/^[A-Za-z0-9+/]{22}==$/);
  });
});
