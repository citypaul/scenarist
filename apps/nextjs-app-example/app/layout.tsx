import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Scenarist - Next.js App Router Example",
  description: "E-commerce demo showcasing Scenarist with Next.js App Router",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
