import { headers } from "next/headers";

/**
 * Base URL for links sent to guests. On Vercel this is the production domain
 * chosen by the owner (VERCEL_PROJECT_PRODUCTION_URL, set automatically), so
 * links copied from a preview deployment still point to the real site.
 * Locally it falls back to the host of the current request.
 */
export async function getPublicBaseUrl(): Promise<string> {
  const productionHost = process.env["VERCEL_PROJECT_PRODUCTION_URL"];
  if (productionHost) return `https://${productionHost}`;
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host") ??
    "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
  return `${protocol}://${host}`;
}

export function invitationUrl(baseUrl: string, token: string): string {
  return `${baseUrl}/i/${token}`;
}
