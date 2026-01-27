"use client";

import { useMemo, useState } from "react";
import type { Post } from "@/lib/types";
import { PostCard } from "@/components/PostCard";
import { CountryAccordion } from "@/components/CountryAccordion";
import { HeroGlobe } from "@/components/HeroGlobe";
import { Reveal } from "@/components/Reveal";
import Link from "next/link";

type Mode = "latest" | "country" | "itinerary";

function ModeToggle({
  mode,
  setMode,
}: {
  mode: Mode;
  setMode: (m: Mode) => void;
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

      <button
        type="button"
        onClick={() => setMode("itinerary")}
        className={[
          "rounded-full px-4 py-2 text-sm font-medium transition",
          mode === "itinerary"
            ? "bg-[#414141] text-[#f5de88] shadow-sm"
            : "text-[hsl(var(--text))] hover:bg-black/5",
        ].join(" ")}
      >
        Itinerary
      </button>
    </div>
  );
}

/** Helpers */
function safeDate(d?: string | null) {
  if (!d) return null;
  const dt = new Date(d);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function yyyyMmDd(dt: Date) {
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const d = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDayLabel(dt: Date) {
  return dt.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function uniq<T>(arr: T[]) {
  return Array.from(new Set(arr));
}

function chip(text: string) {
  return (
    <span className="rounded-full border bg-white px-2.5 py-1 text-xs text-zinc-700 shadow-sm">
      {text}
    </span>
  );
}

function ItineraryPanel({ posts }: { posts: Post[] }) {
  // Sort posts oldest -> newest for itinerary view
  const sorted = useMemo(() => {
    return [...posts]
      .filter((p) => Boolean(p.publishedAt))
      .sort((a, b) => {
        const da = safeDate(a.publishedAt as string)?.getTime() ?? 0;
        const db = safeDate(b.publishedAt as string)?.getTime() ?? 0;
        return da - db;
      });
  }, [posts]);

  // Group by day using publishedAt (your "day anchor")
  const byDay = useMemo(() => {
    const map = new Map<string, { day: Date; items: Post[] }>();
    for (const p of sorted) {
      const dt = safeDate(p.publishedAt as string);
      if (!dt) continue;
      const key = yyyyMmDd(dt);
      const existing = map.get(key);
      if (existing) existing.items.push(p);
      else map.set(key, { day: dt, items: [p] });
    }
    return Array.from(map.values()).sort((a, b) => a.day.getTime() - b.day.getTime());
  }, [sorted]);

  if (!byDay.length) {
    return (
      <section className="mt-6">
        <div className="rounded-2xl border bg-white p-5 text-sm text-zinc-600">
          No dated posts yet — itinerary will appear as you publish posts with a day set.
        </div>
      </section>
    );
  }

  return (
    <section className="mt-6">
      <div className="flex flex-col gap-2">
        <h3 className="text-lg font-semibold tracking-tight">Itinerary</h3>
        <p className="text-sm text-zinc-500">
          A day-by-day view generated from your posts (city, accommodation, activities).
        </p>
      </div>

      <div className="mt-5 space-y-4">
        {byDay.map(({ day, items }) => {
          // Pull day-level rollups from all posts on that day
          const countries = uniq(items.map((p) => p.country).filter(Boolean) as string[]);
          const cities = uniq(items.map((p: any) => p.city).filter(Boolean) as string[]);

          const accommodationNames = uniq(
            items.map((p: any) => p.accommodation?.name).filter(Boolean) as string[]
          );
          const accommodationTypes = uniq(
            items.map((p: any) => p.accommodation?.type).filter(Boolean) as string[]
          );
          const accommodationLinks = uniq(
            items.map((p: any) => p.accommodation?.link).filter(Boolean) as string[]
          );

          const activityObjs = items.flatMap((p: any) => (p.activities ?? []) as any[]);
          const activityTitles = uniq(activityObjs.map((a) => a?.title).filter(Boolean) as string[]);
          const activityNotes = uniq(activityObjs.map((a) => a?.notes).filter(Boolean) as string[]);

          const locationLine = [cities.join(" • "), countries.join(" • ")]
            .filter((x) => x && x.trim().length)
            .join(" — ");

          return (
            <details key={yyyyMmDd(day)} className="group rounded-2xl border bg-white">
              <summary className="cursor-pointer list-none px-4 py-4 sm:px-5 sm:py-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="text-sm font-semibold text-zinc-900">
                      {formatDayLabel(day)}
                    </div>

                    {locationLine ? (
                      <div className="mt-1 text-sm text-zinc-600">{locationLine}</div>
                    ) : (
                      <div className="mt-1 text-sm text-zinc-400">
                        Add city + country to make this pop.
                      </div>
                    )}

                    <div className="mt-3 flex flex-wrap gap-2">
                      {cities.slice(0, 2).map((c, i) => (
                        <span
                          key={`city-${i}`}
                          className="rounded-full border bg-zinc-50 px-2.5 py-1 text-xs text-zinc-700"
                        >
                          {c}
                        </span>
                      ))}
                      {countries.slice(0, 2).map((c, i) => (
                        <span
                          key={`country-${i}`}
                          className="rounded-full border bg-zinc-50 px-2.5 py-1 text-xs text-zinc-700"
                        >
                          {c}
                        </span>
                      ))}
                      {activityTitles.length ? (
                        <span className="rounded-full border bg-[#414141] px-2.5 py-1 text-xs text-[#f5de88]">
                          {activityTitles.length} activit
                          {activityTitles.length === 1 ? "y" : "ies"}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="text-xs text-zinc-500">
                    {items.length} post{items.length === 1 ? "" : "s"}{" "}
                    <span className="ml-2 inline-block rounded-full border bg-zinc-50 px-2 py-0.5">
                      Expand
                    </span>
                  </div>
                </div>
              </summary>

              <div className="border-t px-4 pb-5 pt-5 sm:px-5">
                <div className="grid gap-4 md:grid-cols-2">
                  {/* LEFT: Stay + Activities */}
                  <div className="space-y-4">
                    {/* Accommodation */}
                    <div className="rounded-2xl border bg-zinc-50 p-4">
                      <div className="text-[11px] font-semibold text-zinc-500">
                        WHERE WE STAYED
                      </div>

                      {accommodationNames.length ? (
                        <>
                          <div className="mt-2 text-sm font-semibold text-zinc-900">
                            {accommodationNames.join(" • ")}
                          </div>

                          {accommodationTypes.length ? (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {accommodationTypes.map((t, idx) => (
                                <span
                                  key={`acct-${idx}`}
                                  className="rounded-full border bg-white px-2.5 py-1 text-xs text-zinc-700"
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                          ) : null}

                          {accommodationLinks.length ? (
                            <div className="mt-3 space-y-1">
                              {accommodationLinks.slice(0, 2).map((href, idx) => (
                                <a
                                  key={`accl-${idx}`}
                                  href={href}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="block text-sm text-zinc-700 underline underline-offset-4 hover:text-zinc-900"
                                >
                                  View place ↗
                                </a>
                              ))}
                            </div>
                          ) : null}
                        </>
                      ) : (
                        <div className="mt-2 text-sm text-zinc-500">
                          Add an accommodation name in the post to show it here.
                        </div>
                      )}
                    </div>

                    {/* Activities */}
                    <div className="rounded-2xl border bg-white p-4">
                      <div className="text-[11px] font-semibold text-zinc-500">
                        WHAT WE DID
                      </div>

                      {activityTitles.length ? (
                        <>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {activityTitles.slice(0, 14).map((a, idx) => (
                              <span key={`act-${idx}`} className="rounded-full border bg-zinc-50 px-2.5 py-1 text-xs text-zinc-700">
                                {a}
                              </span>
                            ))}
                          </div>

                          {activityTitles.length > 14 ? (
                            <div className="mt-2 text-xs text-zinc-500">
                              +{activityTitles.length - 14} more
                            </div>
                          ) : null}

                          {activityNotes.length ? (
                            <div className="mt-4 space-y-2">
                              {activityNotes.slice(0, 3).map((n, idx) => (
                                <div
                                  key={`note-${idx}`}
                                  className="rounded-xl border bg-white px-3 py-2 text-sm text-zinc-700"
                                >
                                  {n}
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </>
                      ) : (
                        <div className="mt-2 text-sm text-zinc-500">
                          Add activities in the post to show them here.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* RIGHT: Posts (secondary) */}
                  <div className="rounded-2xl border bg-white p-4">
                    <div className="text-[11px] font-semibold text-zinc-500">
                      READ THE STORIES
                    </div>

                    <div className="mt-3 space-y-3">
                      {items.map((p) => (
                        <div
                          key={p._id}
                          className="flex items-start justify-between gap-3 rounded-xl border bg-zinc-50 px-3 py-3"
                        >
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-zinc-900">
                              {p.title}
                            </div>
                            {p.excerpt ? (
                              <div className="mt-1 line-clamp-2 text-sm text-zinc-600">
                                {p.excerpt}
                              </div>
                            ) : null}
                          </div>

                          <Link
                            href={`/posts/${p.slug}`}
                            className="shrink-0 rounded-full border bg-white px-3 py-1 text-xs text-zinc-700 hover:text-zinc-900"
                          >
                            Open →
                          </Link>
                        </div>
                      ))}
                    </div>

                    {/* Optional: keep cards if you still want visuals (commented out)
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      {items.map((p) => (
                        <PostCard
                          key={p._id}
                          title={p.title}
                          slug={p.slug}
                          excerpt={p.excerpt}
                          coverImage={p.coverImage}
                          publishedAt={p.publishedAt}
                          country={p.country}
                        />
                      ))}
                    </div>
                    */}
                  </div>
                </div>
              </div>
            </details>
          );
        })}
      </div>
    </section>
  );
}

export function HomeView({ posts }: { posts: Post[] }) {
  const [mode, setMode] = useState<Mode>("latest");

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

  const visitedCountries = useMemo(
    () => Array.from(new Set(posts.map((p) => p.country).filter(Boolean) as string[])),
    [posts]
  );

  const currentCountry = posts?.[0]?.country ?? null;

  const routeCountries = useMemo(() => {
    const sorted = [...posts]
      .filter((p) => Boolean(p.publishedAt))
      .sort(
        (a, b) =>
          new Date(a.publishedAt as string).getTime() -
          new Date(b.publishedAt as string).getTime()
      );

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
        <header className="mb-2">
          <div className="flex justify-center -mt-6">
            <HeroGlobe
              visitedCountries={visitedCountries}
              currentCountry={currentCountry}
              routeCountries={routeCountries}
            />
          </div>

          <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-[hsl(var(--text))]">
                Stories and photos from the road.
              </h2>
            </div>

            <ModeToggle mode={mode} setMode={setMode} />
          </div>
        </header>

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
          ) : mode === "country" ? (
            <div id="country">
              <CountryAccordion grouped={grouped} />
            </div>
          ) : (
            <ItineraryPanel posts={posts} />
          )}
        </div>
      </div>
    </main>
  );
}
