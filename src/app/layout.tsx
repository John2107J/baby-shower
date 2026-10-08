import type { Metadata } from "next";
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

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="es-AR">
      <body>{children}</body>
    </html>
  );
}
