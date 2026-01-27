"use client";

import { useMemo, useState } from "react";
import type { Post } from "@/lib/types";
import { PostCard } from "@/components/PostCard";
import { CountryAccordion } from "@/components/CountryAccordion";
import { HeroGlobe } from "@/components/HeroGlobe";
import { Reveal } from "@/components/Reveal";

type Mode = "latest" | "country" | "itinerary";
type ItineraryGroupMode = "day" | "week";

function ModeToggle({
  mode,
  setMode,
}: {
  mode: Mode;
  setMode: (m: Mode) => void;
}) {
  const base =
    "rounded-full px-4 py-2 text-sm font-medium transition";
  const active = "bg-[#414141] text-[#f5de88] shadow-sm";
  const inactive = "text-[hsl(var(--text))] hover:bg-black/5";

  return (
    <div className="inline-flex rounded-full border border-[hsl(0,100%,4%)] p-1 shadow-sm bg-white/60 backdrop-blur">
      <button
        type="button"
        onClick={() => setMode("latest")}
        className={[base, mode === "latest" ? active : inactive].join(" ")}
      >
        Latest
      </button>

      <button
        type="button"
        onClick={() => setMode("country")}
        className={[base, mode === "country" ? active : inactive].join(" ")}
      >
        By Country
      </button>

      <button
        type="button"
        onClick={() => setMode("itinerary")}
        className={[base, mode === "itinerary" ? active : inactive].join(" ")}
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
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function startOfWeekMonday(dt: Date) {
  // Monday-start week
  const copy = new Date(dt);
  const day = copy.getDay(); // Sun=0 ... Sat=6
  const diff = (day === 0 ? -6 : 1) - day; // move to Monday
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function formatWeekRangeLabel(weekStart: Date) {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const sameMonth = weekStart.getMonth() === weekEnd.getMonth();
  const sameYear = weekStart.getFullYear() === weekEnd.getFullYear();

  const left = weekStart.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  });

  const right = weekEnd.toLocaleDateString(undefined, {
    month: sameMonth ? undefined : "short",
    day: "numeric",
    year: "numeric",
  });

  return `Week of ${left} – ${right}`;
}

function ItineraryPanel({ posts }: { posts: Post[] }) {
  const [groupMode, setGroupMode] = useState<ItineraryGroupMode>("week");

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

  const byWeek = useMemo(() => {
    const map = new Map<string, { weekStart: Date; days: Array<{ day: Date; items: Post[] }> }>();

    for (const bucket of byDay) {
      const wk = startOfWeekMonday(bucket.day);
      const wkKey = yyyyMmDd(wk);

      const existing = map.get(wkKey);
      if (existing) existing.days.push(bucket);
      else map.set(wkKey, { weekStart: wk, days: [bucket] });
    }

    return Array.from(map.values()).sort(
      (a, b) => a.weekStart.getTime() - b.weekStart.getTime()
    );
  }, [byDay]);

  const topBar = (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h3 className="text-lg font-semibold tracking-tight">Itinerary</h3>
        <p className="text-sm text-zinc-500">
          A day-by-day view generated from your posts (city, accommodation, activities).
        </p>
      </div>

      <div className="inline-flex rounded-full border bg-white/60 p-1 shadow-sm backdrop-blur">
        <button
          type="button"
          onClick={() => setGroupMode("week")}
          className={[
            "rounded-full px-4 py-2 text-sm font-medium transition",
            groupMode === "week"
              ? "bg-[#414141] text-[#f5de88] shadow-sm"
              : "text-[hsl(var(--text))] hover:bg-black/5",
          ].join(" ")}
        >
          By Week
        </button>
        <button
          type="button"
          onClick={() => setGroupMode("day")}
          className={[
            "rounded-full px-4 py-2 text-sm font-medium transition",
            groupMode === "day"
              ? "bg-[#414141] text-[#f5de88] shadow-sm"
              : "text-[hsl(var(--text))] hover:bg-black/5",
          ].join(" ")}
        >
          By Day
        </button>
      </div>
    </div>
  );

  const renderDay = (bucket: { day: Date; items: Post[] }) => {
    // Combine day info (city/country/accommodation/activities) across posts in that day
    const countries = Array.from(new Set(bucket.items.map((p) => p.country).filter(Boolean) as string[]));
    const cities = Array.from(new Set(bucket.items.map((p) => (p as any).city).filter(Boolean) as string[]));

    const accommodations = bucket.items
      .map((p) => (p as any).accommodation?.name)
      .filter(Boolean) as string[];

    const activities = bucket.items
      .flatMap((p) => ((p as any).activities ?? []) as any[])
      .map((a) => a?.title)
      .filter(Boolean) as string[];

    const chips = [
      ...cities.map((c) => ({ type: "city" as const, label: c })),
      ...countries.map((c) => ({ type: "country" as const, label: c })),
    ].slice(0, 4);

    return (
      <details key={yyyyMmDd(bucket.day)} className="group rounded-2xl border bg-white">
        <summary className="cursor-pointer list-none px-4 py-4 sm:px-5 sm:py-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-semibold text-zinc-900">
                {formatDayLabel(bucket.day)}
              </div>
              <div className="mt-1 flex flex-wrap gap-2">
                {chips.map((c, idx) => (
                  <span
                    key={`${c.type}-${idx}`}
                    className="rounded-full border bg-zinc-50 px-2 py-0.5 text-xs text-zinc-600"
                  >
                    {c.label}
                  </span>
                ))}
              </div>
            </div>

            <div className="text-xs text-zinc-500">
              {bucket.items.length} post{bucket.items.length === 1 ? "" : "s"}
              <span className="ml-2 inline-block rounded-full border bg-zinc-50 px-2 py-0.5">
                {/** little affordance */}
                Expand
              </span>
            </div>
          </div>
        </summary>

        <div className="border-t px-4 pb-4 pt-4 sm:px-5">
          {/* Accommodation */}
          {accommodations.length ? (
            <div className="mb-4">
              <div className="text-[11px] font-semibold text-zinc-500">ACCOMMODATION</div>
              <div className="mt-1 text-sm text-zinc-800">
                {Array.from(new Set(accommodations)).join(" • ")}
              </div>
            </div>
          ) : null}

          {/* Activities */}
          {activities.length ? (
            <div className="mb-4">
              <div className="text-[11px] font-semibold text-zinc-500">ACTIVITIES</div>
              <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                {Array.from(new Set(activities)).slice(0, 12).map((a, i) => (
                  <li key={`${a}-${i}`} className="rounded-xl border bg-white px-3 py-2 text-sm text-zinc-800">
                    {a}
                  </li>
                ))}
              </ul>
              {activities.length > 12 ? (
                <div className="mt-2 text-xs text-zinc-500">
                  +{activities.length - 12} more
                </div>
              ) : null}
            </div>
          ) : null}

          {/* Posts from that day */}
          <div className="text-[11px] font-semibold text-zinc-500">POSTS</div>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            {bucket.items.map((p) => (
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
        </div>
      </details>
    );
  };

  return (
    <section className="mt-6">
      {topBar}

      <div className="mt-5 space-y-4">
        {groupMode === "day" ? (
          byDay.length ? (
            byDay.map(renderDay)
          ) : (
            <div className="rounded-2xl border bg-white p-5 text-sm text-zinc-600">
              No dated posts yet — itinerary will appear as you publish posts with <code>publishedAt</code>.
            </div>
          )
        ) : byWeek.length ? (
          byWeek.map((w) => (
            <details key={yyyyMmDd(w.weekStart)} className="group rounded-2xl border bg-white">
              <summary className="cursor-pointer list-none px-4 py-4 sm:px-5 sm:py-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-zinc-900">
                      {formatWeekRangeLabel(w.weekStart)}
                    </div>
                    <div className="mt-1 text-xs text-zinc-500">
                      {w.days.length} day{w.days.length === 1 ? "" : "s"}
                    </div>
                  </div>
                  <span className="text-xs text-zinc-500 rounded-full border bg-zinc-50 px-2 py-0.5">
                    Expand
                  </span>
                </div>
              </summary>

              <div className="border-t px-4 pb-4 pt-4 sm:px-5">
                <div className="space-y-3">
                  {w.days.map(renderDay)}
                </div>
              </div>
            </details>
          ))
        ) : (
          <div className="rounded-2xl border bg-white p-5 text-sm text-zinc-600">
            No dated posts yet — itinerary will appear as you publish posts with <code>publishedAt</code>.
          </div>
        )}
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
