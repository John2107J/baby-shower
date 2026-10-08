import { Allura, Quicksand } from "next/font/google";

// Self-hosted at build time by Next.js: no requests to Google from the guest's browser,
// so the CSP can keep font-src 'self'. Allura chosen by the owner (decision 31).
export const scriptFont = Allura({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-script",
  display: "swap",
});

export const bodyFont = Quicksand({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});
