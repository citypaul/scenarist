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
      <body>
        <nav className="bg-gray-800 text-white p-4">
          <div className="container mx-auto flex gap-6">
            <a href="/" className="hover:text-blue-300">
              Home
            </a>
            <a href="/products" className="hover:text-blue-300">
              Products (RSC)
            </a>
            <a href="/cart" className="hover:text-blue-300">
              Cart
            </a>
          </div>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}
