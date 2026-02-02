import type { Metadata } from "next";
import "./globals.css";
import { PageTransition } from "@/components/PageTransition";
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

        <div className="w-full px-2 lg:px-2">
        <header className="pt-4 pb-1 flex justify-center">
          <a
            href="/"
            className="font-semibold tracking-tight text-xl md:text-2xl hover:opacity-70 transition text-center"
          >
            Amanda &amp; Jovan&apos;s Travel Journal
          </a>
        </header>

          <main className="pb-20">
            <PageTransition>{children}</PageTransition>
          </main>

          <footer className="py-10 text-sm text-[rgb(var(--muted))] border-t border-[rgb(var(--border))]">
            {/* optional footer content */}
          </footer>
        </div>
      </body>
    </html>
  );
}
