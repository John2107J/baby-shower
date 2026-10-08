import type { Metadata } from "next";
import { connection } from "next/server";
import type { ReactNode } from "react";
import "./globals.css";

const productionHost = process.env["VERCEL_PROJECT_PRODUCTION_URL"];

export const metadata: Metadata = {
  // Absolute URLs for link-preview images.
  metadataBase: new URL(
    productionHost ? `https://${productionHost}` : "http://localhost:3000",
  ),
  title: "Baby Shower",
  robots: { index: false, follow: false },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  // Every page is rendered per request so it can carry that request's CSP
  // nonce; a page built ahead of time would have its scripts blocked.
  await connection();
  return (
    <html lang="es-AR">
      <body>{children}</body>
    </html>
  );
}
