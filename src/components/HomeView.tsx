"use client";

import { useMemo, useState } from "react";
import type { Post } from "@/lib/types";
import { PostCard } from "@/components/PostCard";
import { CountryAccordion } from "@/components/CountryAccordion";
import { Reveal } from "@/components/Reveal";

function ModeToggle({
  mode,
  setMode,
}: {
  mode: "latest" | "country";
  setMode: (m: "latest" | "country") => void;
}) {
  return (
    <div className="inline-flex rounded-full border border-[hsl(var(--border))] p-1 shadow-sm">
      <button
        type="button"
        onClick={() => setMode("latest")}
        className={[
          "rounded-full px-4 py-2 text-sm font-medium transition",
          mode === "latest"
            ? "bg-[hsl(var(--accent))] text-white shadow-sm"
            : "text-[hsl(var(--text))] hover:bg-black/5",
        ].join(" ")}
      >
        Latest
      </button>

      <button
        type="button"
        onClick={() => setMode("country")}
        className={[
          "rounded-full px-4 py-2 text-sm font-medium transition",
          mode === "country" 
            ? "bg-[hsl(var(--accent))] text-white shadow-sm"
            : "text-[hsl(var(--text))] hover:bg-black/5",
        ].join(" ")}
      >
        By Country
      </button>
    </div>
  );
}

export function HomeView({ posts }: { posts: Post[] }) {
  const [mode, setMode] = useState<"latest" | "country">("latest");

  const grouped = useMemo(() => {
    const map = new Map<string, Post[]>();
    for (const p of posts) {
      const c = (p.country || "Other").trim();
      map.set(c, [...(map.get(c) ?? []), p]);
    }

    // Countries A–Z; posts inside newest-first (your GROQ already orders desc)
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([country, posts]) => ({ country, posts }));
  }, [posts]);

  return (
    <main className="min-h-screen text-[hsl(var(--text))]">
      <div className="mx-auto max-w-5xl px-5 py-10">
        <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-[hsl(var(--text))]">
            Stories and photos from the road.
            </h2>
          </div>

          <ModeToggle mode={mode} setMode={setMode} />
        </header>

        {/* subtle transition between views without libraries */}
        <div className="transition-opacity duration-200">
          {mode === "latest" ? (
              <section className="grid gap-6 md:grid-cols-2">
              {posts.map((p, idx) => (
                <Reveal key={p._id} delayMs={Math.min(idx * 60, 360)}>
                  <PostCard
                    title={p.title}
                    slug={p.slug}
                    excerpt={p.excerpt}
                    coverImage={p.coverImage}
                    publishedAt={p.publishedAt}
                    country={p.country}
                  />
                </Reveal>
              ))}
            </section>
          ) : (
            <div id="country">
              <CountryAccordion grouped={grouped} />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
