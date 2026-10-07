import { describe, expect, it } from "vitest";
import {
  buildContentSecurityPolicy,
  buildSecurityHeaders,
} from "@/lib/security-headers";

const headerValue = (isDevelopment: boolean, key: string) =>
  buildSecurityHeaders(isDevelopment).find((header) => header.key === key)
    ?.value;

describe("buildSecurityHeaders", () => {
  it.each([
    "Content-Security-Policy",
    "Strict-Transport-Security",
    "X-Content-Type-Options",
    "Referrer-Policy",
    "Permissions-Policy",
    "X-Robots-Tag",
    "X-Frame-Options",
  ])("includes %s", (key) => {
    expect(headerValue(false, key)).toBeTruthy();
  });

  it("marks every page as noindex", () => {
    expect(headerValue(false, "X-Robots-Tag")).toContain("noindex");
  });
});

describe("buildContentSecurityPolicy", () => {
  it("does not allow eval in production", () => {
    expect(buildContentSecurityPolicy(false)).not.toContain("unsafe-eval");
  });

  it("forbids framing and plugins", () => {
    const policy = buildContentSecurityPolicy(false);
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).toContain("object-src 'none'");
  });
});
