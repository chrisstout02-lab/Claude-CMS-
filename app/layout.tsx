import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Portfolio Dashboard",
  description: "Understand your Robinhood portfolio: allocation, fundamentals, and redundant/overlapping positions.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <nav
          className="flex gap-4 border-b px-4 py-2 text-sm sm:px-6"
          style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}
        >
          <Link href="/" style={{ color: "var(--text-secondary)" }}>
            Portfolio
          </Link>
          <Link href="/cfb" style={{ color: "var(--text-secondary)" }}>
            College Football
          </Link>
        </nav>
        {children}
      </body>
    </html>
  );
}
