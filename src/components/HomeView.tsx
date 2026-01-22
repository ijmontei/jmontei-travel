// app/(whatever)/HomeView.tsx (or wherever your HomeView lives)
"use client";

import { useMemo, useState } from "react";
import type { Post } from "@/lib/types";
import { PostCard } from "@/components/PostCard";
import { CountryAccordion } from "@/components/CountryAccordion";
import { HeroGlobe } from "@/components/HeroGlobe";
import { Reveal } from "@/components/Reveal";

function ModeToggle({
  mode,
  setMode,
}: {
  mode: "latest" | "country";
  setMode: (m: "latest" | "country") => void;
}) {
  return (
    <div className="inline-flex rounded-full border border-[hsl(0,100%,4%)] p-1 shadow-sm bg-white/60 backdrop-blur">
      <button
        type="button"
        onClick={() => setMode("latest")}
        className={[
          "rounded-full px-4 py-2 text-sm font-medium transition",
          mode === "latest"
            ? "bg-[#414141] text-[#f5de88] shadow-sm"
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
            ? "bg-[#414141] text-[#f5de88] shadow-sm"
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

    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([country, posts]) => ({ country, posts }));
  }, [posts]);

  // Countries used by globe (visited = any country appearing in posts)
  const visitedCountries = useMemo(
    () => Array.from(new Set(posts.map((p) => p.country).filter(Boolean) as string[])),
    [posts]
  );

  // Current country = latest post country (posts are newest-first)
  const currentCountry = posts?.[0]?.country ?? null;

  const routeCountries = useMemo(() => {
    const sorted = [...posts]
      .filter((p) => Boolean(p.publishedAt))
      .sort((a, b) => {
        const ta = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
        const tb = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
        return ta - tb;
      });

    const seen = new Set<string>();
    const route: string[] = [];

    for (const p of sorted) {
      const c = (p.country || "").trim();
      if (!c) continue;
      if (seen.has(c)) continue;
      seen.add(c);
      route.push(c);
    }

    return route;
  }, [posts]);

  return (
    <main className="min-h-screen text-[hsl(var(--text))]">
      <div className="mx-auto max-w-5xl px-5 py-10">
        {/* HERO SECTION */}
        <header className="mb-2">
          {/* Globe first (hero centerpiece) */}
          <div className="relative flex justify-center -mt-6">
            {/* Gravitational “lens” warp behind the globe */}
            <div
              className="pointer-events-none absolute inset-0 flex items-center justify-center"
              aria-hidden
            >
              <svg
                width="520"
                height="520"
                viewBox="0 0 520 520"
                className="opacity-[0.18] sm:opacity-[0.16] md:opacity-[0.14]"
              >
                <defs>
                  <filter id="gravityWarp" x="-35%" y="-35%" width="170%" height="170%">
                    <feTurbulence
                      type="fractalNoise"
                      baseFrequency="0.012"
                      numOctaves="2"
                      seed="2"
                      result="noise"
                    >
                      <animate
                        attributeName="baseFrequency"
                        dur="9s"
                        values="0.010;0.014;0.010"
                        repeatCount="indefinite"
                      />
                    </feTurbulence>

                    <feDisplacementMap
                      in="SourceGraphic"
                      in2="noise"
                      scale="16"
                      xChannelSelector="R"
                      yChannelSelector="G"
                    />
                  </filter>

                  <radialGradient id="lens" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.85)" />
                    <stop offset="55%" stopColor="rgba(255,255,255,0.22)" />
                    <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                  </radialGradient>
                </defs>

                {/* lens shape */}
                <circle cx="260" cy="260" r="175" fill="url(#lens)" filter="url(#gravityWarp)" />
              </svg>
            </div>

            <HeroGlobe
              visitedCountries={visitedCountries}
              currentCountry={currentCountry}
              routeCountries={routeCountries}
            />
          </div>

          {/* Then headline + toggle */}
          <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-[hsl(var(--text))]">
                Stories and photos from the road.
              </h2>
            </div>

            <ModeToggle mode={mode} setMode={setMode} />
          </div>
        </header>

        {/* CONTENT */}
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
