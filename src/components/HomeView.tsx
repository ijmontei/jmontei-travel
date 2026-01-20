"use client";

import { useMemo, useState } from "react";
import type { Post } from "@/lib/types";
import { PostCard } from "@/components/PostCard";
import { CountryAccordion } from "@/components/CountryAccordion";

export function HomeView({ posts }: { posts: Post[] }) {
  const [mode, setMode] = useState<"latest" | "country">("latest");

  const grouped = useMemo(() => {
    const map = new Map<string, Post[]>();
    for (const p of posts) {
      const c = (p.country || "Other").trim();
      map.set(c, [...(map.get(c) ?? []), p]);
    }

    // Countries A–Z; posts inside are already newest-first from the query
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([country, posts]) => ({ country, posts }));
  }, [posts]);

  return (
    <main className="min-h-screen bg-[hsl(var(--bg))] text-[hsl(var(--text))]">
      <div className="mx-auto max-w-5xl px-5 py-10">
        <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">A+J Travels</h1>
            <p className="mt-2 text-sm text-[hsl(var(--muted))]">
              Stories and photos from the road.
            </p>
          </div>

          <div className="flex rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-1 w-fit">
            <button
              onClick={() => setMode("latest")}
              className={`px-4 py-2 text-sm rounded-full transition ${
                mode === "latest"
                  ? "bg-[hsl(var(--accent))] text-white"
                  : "hover:bg-white/60"
              }`}
            >
              Latest
            </button>
            <button
              onClick={() => setMode("country")}
              className={`px-4 py-2 text-sm rounded-full transition ${
                mode === "country"
                  ? "bg-[hsl(var(--accent))] text-white"
                  : "hover:bg-white/60"
              }`}
            >
              Country
            </button>
          </div>
        </header>

        {mode === "latest" ? (
          <section className="grid gap-6 md:grid-cols-2">
            {posts.map((p) => (
              <PostCard
                key={p._id}
                title={p.title}
                slug={p.slug}
                excerpt={p.excerpt}
                coverImage={p.coverImage}
                publishedAt={p.publishedAt}
              />
            ))}
          </section>
        ) : (
          <CountryAccordion grouped={grouped} />
        )}
      </div>
    </main>
  );
}
