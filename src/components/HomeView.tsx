"use client";

import { useMemo, useState } from "react";
import type { Post } from "@/lib/types";
import { PostCard } from "@/components/PostCard";
import { CountryAccordion } from "@/components/CountryAccordion";
import { HeroGlobe } from "@/components/HeroGlobe";
import { Reveal } from "@/components/Reveal";
import Link from "next/link";

type Mode = "latest" | "country" | "itinerary";

/** ---------- Toggle ---------- */
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

/** ---------- Helpers ---------- */
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

function PlaneIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10.5 21l1.5-6 6-6 4-1-1 4-6 6-6 1.5z" />
      <path d="M6 14l-4 1 1-4 6-6 6-1.5-1.5 6" />
    </svg>
  );
}

function CarIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 13l2-6a2 2 0 0 1 2-1h10a2 2 0 0 1 2 1l2 6" />
      <path d="M5 13h14" />
      <path d="M6 18h.01" />
      <path d="M18 18h.01" />
      <path d="M4 13v5a1 1 0 0 0 1 1h1" />
      <path d="M20 13v5a1 1 0 0 1-1 1h-1" />
    </svg>
  );
}

/** Build condensed location tags like "Marrakesh, Morocco" (multiple if needed) */
function buildLocationTags(items: Post[]) {
  return uniq(
    items
      .map((p: any) => {
        const city = (p.city || "").trim();
        const country = (p.country || "").trim();
        if (!city && !country) return null;
        if (city && country) return `${city}, ${country}`;
        return city || country;
      })
      .filter(Boolean) as string[]
  );
}

/** Determine a primary country/city for a day (for travel divider comparisons) */
function primaryCountry(items: Post[]) {
  const countries = uniq(items.map((p) => (p.country || "").trim()).filter(Boolean) as string[]);
  return countries[0] || null;
}
function primaryCity(items: Post[]) {
  const cities = uniq(items.map((p: any) => (p.city || "").trim()).filter(Boolean) as string[]);
  return cities[0] || null;
}

/** ---------- Itinerary Panel ---------- */
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

  // Latest (for "Current location")
  const latest = useMemo(() => {
    const newest = [...posts]
      .filter((p) => Boolean(p.publishedAt))
      .sort(
        (a, b) =>
          (safeDate(b.publishedAt as string)?.getTime() ?? 0) -
          (safeDate(a.publishedAt as string)?.getTime() ?? 0)
      )[0];

    const city = (newest as any)?.city as string | undefined;
    const country = newest?.country as string | undefined;

    return {
      city,
      country,
      date: newest?.publishedAt,
    };
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
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h3 className="text-xl font-semibold tracking-tight">
          Itinerary{" "}
          <span className="align-middle text-xs font-semibold tracking-wide text-zinc-500">
            (day-by-day)
          </span>
        </h3>
        <p className="text-sm text-zinc-500">
          Where we went, where we stayed, and what we did — generated from our posts.
        </p>
      </div>

      {/* Current location card */}
      {(latest.city || latest.country) ? (
        <div className="mt-5 rounded-2xl border bg-gradient-to-r from-white via-zinc-50 to-white p-4 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-[11px] font-semibold tracking-wide text-zinc-500">
                CURRENT LOCATION
              </div>
              <div className="mt-1 text-base font-semibold text-zinc-900">
                {[latest.city, latest.country].filter(Boolean).join(" — ")}
              </div>
              {latest.date ? (
                <div className="mt-1 text-xs text-zinc-500">
                  Last updated {new Date(latest.date).toLocaleDateString()}
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border bg-[#414141] px-3 py-1 text-xs font-semibold text-[#f5de88] shadow-sm">
                Live itinerary
              </span>
              <span className="rounded-full border bg-white px-3 py-1 text-xs text-zinc-700 shadow-sm">
                Auto from posts
              </span>
            </div>
          </div>
        </div>
      ) : null}

      {/* Timeline wrapper */}
      <div className="mt-6 relative">
        {/* vertical line */}
        <div className="pointer-events-none absolute left-[14px] top-0 h-full w-px bg-gradient-to-b from-transparent via-zinc-300 to-transparent" />

        <div className="space-y-5">
          {byDay.map(({ day, items }, idx) => {
            const locTags = buildLocationTags(items);

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
            const activityTitles = uniq(
              activityObjs.map((a) => a?.title).filter(Boolean) as string[]
            );
            const activityNotes = uniq(
              activityObjs.map((a) => a?.notes).filter(Boolean) as string[]
            );

            // ---- Travel divider logic (between days) ----
            const prev = idx > 0 ? byDay[idx - 1] : null;

            const prevCountry = prev ? primaryCountry(prev.items) : null;
            const prevCity = prev ? primaryCity(prev.items) : null;

            const curCountry = primaryCountry(items);
            const curCity = primaryCity(items);

            const isNewCountry =
              Boolean(prevCountry) && Boolean(curCountry) && prevCountry !== curCountry;

            const isNewCitySameCountry =
              !isNewCountry &&
              Boolean(prevCountry) &&
              Boolean(curCountry) &&
              prevCountry === curCountry &&
              Boolean(prevCity) &&
              Boolean(curCity) &&
              prevCity !== curCity;

            const showTravelDivider = isNewCountry || isNewCitySameCountry;

            return (
              <div key={yyyyMmDd(day)}>
                {/* Travel divider */}
                {showTravelDivider ? (
                  <div className="relative pl-12">
                    <div className="absolute left-[8px] top-2 h-3 w-3 rounded-full border bg-white shadow-sm" />

                    <div className="mb-3 rounded-2xl border bg-gradient-to-r from-white via-zinc-50 to-white px-4 py-3 shadow-sm">
                      <div className="flex items-center gap-3">
                        <span className="rounded-full border bg-[#414141] p-2 text-[#f5de88] shadow-sm">
                          {isNewCountry ? (
                            <PlaneIcon className="h-4 w-4" />
                          ) : (
                            <CarIcon className="h-4 w-4" />
                          )}
                        </span>

                        <div className="min-w-0">
                          <div className="text-[11px] font-semibold tracking-wide text-zinc-500">
                            {isNewCountry ? "TRAVEL DAY" : "TRANSIT"}
                          </div>

                          <div className="text-sm font-semibold text-zinc-900">
                            {isNewCountry
                              ? `Flight to ${curCountry ?? "next stop"}`
                              : `Transit to ${curCity ?? "next stop"}`}
                          </div>

                          <div className="text-xs text-zinc-500">
                            {isNewCountry
                              ? `from ${prevCountry ?? ""}`
                              : `${prevCity ?? ""} → ${curCity ?? ""}${
                                  curCountry ? ` · ${curCountry}` : ""
                                }`}
                          </div>
                        </div>

                        <div className="ml-auto hidden sm:flex items-center gap-2">
                          <span className="rounded-full border bg-white px-3 py-1 text-xs text-zinc-700 shadow-sm">
                            {isNewCountry
                              ? `${prevCountry ?? "—"} → ${curCountry ?? "—"}`
                              : `${prevCity ?? "—"} → ${curCity ?? "—"}`}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* Day card */}
                <details className="group relative rounded-2xl border bg-white shadow-sm transition hover:shadow-md">
                  {/* timeline dot */}
                  <div className="absolute left-[8px] top-6 h-3 w-3 rounded-full border bg-white shadow-sm" />

                  <summary className="cursor-pointer list-none px-5 py-5 pl-12">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="text-base font-semibold tracking-tight text-zinc-900">
                          {formatDayLabel(day)}
                        </div>

                        {/* Tags only (no subtitle) */}
                        <div className="mt-3 flex flex-wrap gap-2">
                          {locTags.slice(0, 4).map((t, i) => (
                            <span
                              key={`loc-${i}`}
                              className="rounded-full border bg-zinc-50 px-2.5 py-1 text-xs text-zinc-700"
                            >
                              {t}
                            </span>
                          ))}

                          {activityTitles.length ? (
                            <span className="rounded-full border bg-[#414141] px-2.5 py-1 text-xs font-semibold text-[#f5de88]">
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

                  <div className="border-t px-5 pb-6 pt-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      {/* LEFT: Stay + Activities */}
                      <div className="space-y-4">
                        {/* Accommodation */}
                        <div className="rounded-2xl border bg-gradient-to-br from-zinc-50 to-white p-4">
                          <div className="text-[11px] font-semibold tracking-wide text-zinc-500">
                            WHERE WE STAYED
                          </div>

                          {accommodationNames.length ? (
                            <>
                              <div className="mt-2 text-base font-semibold text-zinc-900">
                                {accommodationNames.join(" • ")}
                              </div>

                              {accommodationTypes.length ? (
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {accommodationTypes.map((t, i) => (
                                    <span
                                      key={`acct-${i}`}
                                      className="rounded-full border bg-white px-2.5 py-1 text-xs text-zinc-700 shadow-sm"
                                    >
                                      {t}
                                    </span>
                                  ))}
                                </div>
                              ) : null}

                              {accommodationLinks.length ? (
                                <div className="mt-3 space-y-1">
                                  {accommodationLinks.slice(0, 2).map((href, i) => (
                                    <a
                                      key={`accl-${i}`}
                                      href={href}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-800 underline underline-offset-4 hover:text-zinc-900"
                                    >
                                      View place <span aria-hidden>↗</span>
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
                          <div className="flex items-center justify-between">
                            <div className="text-[11px] font-semibold tracking-wide text-zinc-500">
                              WHAT WE DID
                            </div>
                            <span className="rounded-full border bg-zinc-50 px-2 py-0.5 text-[11px] text-zinc-600">
                              {activityTitles.length || 0} items
                            </span>
                          </div>

                          {activityTitles.length ? (
                            <>
                              <div className="mt-3 flex flex-wrap gap-2">
                                {activityTitles.slice(0, 16).map((a, i) => (
                                  <span
                                    key={`act-${i}`}
                                    className="rounded-full border bg-zinc-50 px-2.5 py-1 text-xs text-zinc-700"
                                  >
                                    {a}
                                  </span>
                                ))}
                              </div>

                              {activityTitles.length > 16 ? (
                                <div className="mt-2 text-xs text-zinc-500">
                                  +{activityTitles.length - 16} more
                                </div>
                              ) : null}

                              {activityNotes.length ? (
                                <div className="mt-4 space-y-2">
                                  {activityNotes.slice(0, 3).map((n, i) => (
                                    <div
                                      key={`note-${i}`}
                                      className="rounded-xl border bg-zinc-50 px-3 py-2 text-sm text-zinc-700 whitespace-pre-wrap break-words"
                                    >
                                      <div className="line-clamp-3">{n}</div>
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
                      <div className="rounded-2xl border bg-gradient-to-b from-white to-zinc-50 p-4">
                        <div className="text-[11px] font-semibold tracking-wide text-zinc-500">
                          READ THE STORIES
                        </div>

                        <div className="mt-3 space-y-3">
                          {items.map((p) => (
                            <div
                              key={p._id}
                              className="flex items-start justify-between gap-3 rounded-xl border bg-white px-3 py-3 shadow-sm"
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
                                className="shrink-0 rounded-full border bg-[#414141] px-3 py-1 text-xs font-semibold text-[#f5de88] hover:opacity-90"
                              >
                                Open →
                              </Link>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </details>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/** ---------- HomeView ---------- */
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
        {/* HERO SECTION */}
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