import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RestLab",
  description: "A browser-based REST API playground.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
