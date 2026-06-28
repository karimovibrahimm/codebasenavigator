import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Codebase Navigator",
  description: "Persistent codebase understanding — explore unfamiliar projects fast.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="h-full antialiased">{children}</body>
    </html>
  );
}
