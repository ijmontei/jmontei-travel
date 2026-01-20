import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "A + J Travels",
  description: "Travel updates, photos, and posts.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-zinc-900">
        <div className="mx-auto max-w-4xl px-5">
          <header className="py-10 flex items-center justify-between">
            <a href="/" className="font-semibold tracking-tight text-xl">J & A</a>
          </header>

          <main className="pb-20">{children}</main>

          <footer className="py-10 text-sm text-zinc-500 border-t">
            © {new Date().getFullYear()} jmontei.com
          </footer>
        </div>
      </body>
    </html>
  );
}
