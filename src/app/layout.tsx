import type { Metadata } from "next";
import "./globals.css";
import { AmbientBackground } from "@/components/AmbientBackground";

export const metadata: Metadata = {
  title: "A + J Travels",
  description: "Travel updates, photos, and posts.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen text-[rgb(var(--text))]">
        <AmbientBackground />

        <div className="mx-auto max-w-4xl px-5">
          <header className="py-10 flex items-center justify-between">
            <a
              href="/"
              className="font-semibold tracking-tight text-xl hover:opacity-90 transition"
            >
              Jovan &amp; Amanda&apos;s Travels
            </a>
          </header>

          <main className="pb-20">{children}</main>

          <footer className="py-10 text-sm text-[rgb(var(--muted))] border-t border-[rgb(var(--border))]">
          
          </footer>
        </div>
      </body>
    </html>
  );
}
