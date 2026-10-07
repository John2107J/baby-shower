const UNKNOWN_IP = "unknown";

/**
 * Client IP as reported by the hosting platform. On Vercel these headers are
 * set by the edge network and cannot be forged by the client.
 */
export function getClientIp(headers: Headers): string {
  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  const forwardedFor = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwardedFor || UNKNOWN_IP;
}
