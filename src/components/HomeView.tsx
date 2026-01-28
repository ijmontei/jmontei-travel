"use client";

import { useMemo, useState } from "react";
import type { ReactNode, CSSProperties } from "react";
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

/** Stable country-based color (no hard-coded palette) */
function hashToHue(input: string) {
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) % 360;
  return h;
}
function countryHue(country?: string | null) {
  return hashToHue((country || "Unknown").toLowerCase());
}
function stampStyle(country?: string | null): CSSProperties {
  const hue = countryHue(country);
  return {
    borderColor: `hsla(${hue}, 70%, 45%, 0.35)`,
    color: `hsla(${hue}, 70%, 28%, 0.75)`,
    background: `linear-gradient(135deg, hsla(${hue}, 70%, 85%, 0.40), hsla(${hue}, 70%, 95%, 0.18))`,
  };
}
function dotStyle(country?: string | null): CSSProperties {
  const hue = countryHue(country);
  return {
    background: `radial-gradient(circle at 30% 30%, hsla(${hue}, 85%, 65%, 1), hsla(${hue}, 85%, 40%, 1))`,
    boxShadow: `0 0 0 3px hsla(${hue}, 80%, 65%, 0.16), 0 10px 24px hsla(${hue}, 80%, 45%, 0.18)`,
  };
}
function tagStyle(country?: string | null): CSSProperties {
  const hue = countryHue(country);
  return {
    background: `linear-gradient(135deg, hsla(${hue}, 70%, 92%, 0.92), hsla(${hue}, 70%, 96%, 0.92))`,
    borderColor: `hsla(${hue}, 60%, 60%, 0.25)`,
    color: `hsla(${hue}, 35%, 22%, 0.95)`,
  };
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

function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border bg-white/70 px-2.5 py-1 text-xs text-zinc-700 shadow-sm">
      {children}
    </span>
  );
}

/** ---------- Mini map (stylized thumbnail) ---------- */
function MiniMap({
  country,
  city,
  label,
}: {
  country?: string | null;
  city?: string | null;
  label?: string;
}) {
  const hue = countryHue(country);
  const subtitle = [city, country].filter(Boolean).join(", ");

  return (
    <div className="rounded-2xl border bg-white overflow-hidden shadow-sm">
      <div
        className="relative h-36"
        style={{
          background: `radial-gradient(circle at 20% 20%, hsla(${hue}, 85%, 65%, 0.22), transparent 55%),
                      radial-gradient(circle at 80% 40%, hsla(${hue}, 85%, 55%, 0.18), transparent 60%),
                      linear-gradient(180deg, rgba(255,255,255,0.95), rgba(250,250,250,0.92))`,
        }}
      >
        {/* grid */}
        <svg className="absolute inset-0 h-full w-full opacity-70" viewBox="0 0 400 200" aria-hidden="true">
          <defs>
            <pattern id={`grid-${hue}`} width="24" height="24" patternUnits="userSpaceOnUse">
              <path d="M 24 0 L 0 0 0 24" fill="none" stroke={`hsla(${hue}, 20%, 30%, 0.10)`} strokeWidth="1" />
            </pattern>
            <radialGradient id={`pulse-${hue}`} cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor={`hsla(${hue}, 85%, 55%, 0.35)`} />
              <stop offset="70%" stopColor={`hsla(${hue}, 85%, 55%, 0.12)`} />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>

          <rect x="0" y="0" width="400" height="200" fill={`url(#grid-${hue})`} />
          <circle cx="280" cy="95" r="70" fill={`url(#pulse-${hue})`} />
          <circle cx="280" cy="95" r="5" fill={`hsla(${hue}, 85%, 40%, 1)`} />
          <circle cx="280" cy="95" r="10" fill="none" stroke={`hsla(${hue}, 85%, 40%, 0.55)`} />
          <path
            d="M40 150 C 120 80, 190 120, 280 95"
            fill="none"
            stroke={`hsla(${hue}, 70%, 45%, 0.35)`}
            strokeWidth="3"
            strokeDasharray="6 6"
            strokeLinecap="round"
          />
        </svg>

        {/* label chip */}
        <div className="absolute left-3 top-3">
          <span
            className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold shadow-sm"
            style={{
              background: `linear-gradient(135deg, hsla(${hue}, 70%, 92%, 0.95), hsla(${hue}, 70%, 96%, 0.95))`,
              borderColor: `hsla(${hue}, 60%, 55%, 0.25)`,
              color: `hsla(${hue}, 35%, 22%, 0.95)`,
            }}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: `hsla(${hue}, 85%, 40%, 1)` }}
            />
            {label || "Mini map"}
          </span>
        </div>
      </div>

      <div className="px-4 py-3">
        <div className="text-[11px] font-semibold tracking-wide text-zinc-500">LOCATION SNAPSHOT</div>
        <div className="mt-1 text-sm font-semibold text-zinc-900">
          {subtitle || "Add a city to show a location here."}
        </div>
      </div>
    </div>
  );
}

/** ---------- Country banner ---------- */
function CountryBanner({ country }: { country: string }) {
  const hue = countryHue(country);
  return (
    <div className="relative pl-12">
      <div className="absolute left-[6px] top-6 h-4 w-4 rounded-full border border-white/80" style={dotStyle(country)} />
      <div
        className="rounded-2xl border px-5 py-4 shadow-sm overflow-hidden"
        style={{
          background: `linear-gradient(135deg, hsla(${hue}, 80%, 92%, 0.80), rgba(255,255,255,0.85))`,
          borderColor: `hsla(${hue}, 55%, 60%, 0.20)`,
        }}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="text-[11px] font-extrabold tracking-[0.18em] uppercase" style={{ color: `hsla(${hue}, 60%, 28%, 0.65)` }}>
              Country chapter
            </div>
            <div className="mt-1 text-xl font-extrabold tracking-tight text-zinc-900 truncate">{country}</div>
          </div>

          <div
            className="hidden sm:flex items-center rounded-full border px-3 py-1 text-xs font-semibold"
            style={{
              background: `linear-gradient(135deg, hsla(${hue}, 70%, 96%, 0.95), hsla(${hue}, 70%, 92%, 0.70))`,
              borderColor: `hsla(${hue}, 60%, 55%, 0.20)`,
              color: `hsla(${hue}, 45%, 25%, 0.80)`,
            }}
          >
            New stop ✦
          </div>
        </div>
      </div>
    </div>
  );
}

/** ---------- Itinerary Panel ---------- */
function ItineraryPanel({ posts }: { posts: Post[] }) {
  // Filters
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [country, setCountry] = useState<string>("All");
  const [city, setCity] = useState<string>("All");
  const [activity, setActivity] = useState<string>("All");
  const [dateFrom, setDateFrom] = useState<string>(""); // YYYY-MM-DD
  const [dateTo, setDateTo] = useState<string>(""); // YYYY-MM-DD
  const [q, setQ] = useState<string>("");

  const countryOptions = useMemo(() => {
    return ["All", ...uniq(posts.map((p) => (p.country || "").trim()).filter(Boolean) as string[])].sort(
      (a, b) => a.localeCompare(b)
    );
  }, [posts]);

  // City options narrowed by selected country (nice UX)
  const cityOptions = useMemo(() => {
    const base =
      country === "All" ? posts : posts.filter((p) => (p.country || "").trim() === country);

    return ["All", ...uniq(base.map((p: any) => (p.city || "").trim()).filter(Boolean) as string[])].sort(
      (a, b) => a.localeCompare(b)
    );
  }, [posts, country]);

  const activityOptions = useMemo(() => {
    const all = posts.flatMap((p: any) =>
      (p.activities ?? []).map((a: any) => (a?.title || "").trim())
    );
    return ["All", ...uniq(all.filter(Boolean) as string[])].sort((a, b) => a.localeCompare(b));
  }, [posts]);

  const filtered = useMemo(() => {
    return posts.filter((p: any) => {
      const dt = safeDate(p.publishedAt);
      if (!dt) return false;

      const ctry = (p.country || "").trim();
      const cty = (p.city || "").trim();
      const acts: string[] = (p.activities ?? [])
        .map((a: any) => (a?.title || "").trim())
        .filter(Boolean);

      if (country !== "All" && ctry !== country) return false;
      if (city !== "All" && cty !== city) return false;
      if (activity !== "All" && !acts.includes(activity)) return false;

      if (dateFrom) {
        const from = new Date(`${dateFrom}T00:00:00`);
        if (dt < from) return false;
      }
      if (dateTo) {
        const to = new Date(`${dateTo}T23:59:59`);
        if (dt > to) return false;
      }

      if (q.trim()) {
        const hay = [p.title, p.excerpt, ctry, cty, ...acts]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q.trim().toLowerCase())) return false;
      }

      return true;
    });
  }, [posts, country, city, activity, dateFrom, dateTo, q]);

  // Group filtered posts by day (DESC = most recent at top)
  const byDay = useMemo(() => {
    const map = new Map<string, { day: Date; items: Post[] }>();

    for (const p of filtered) {
      const dt = safeDate((p as any).publishedAt as string);
      if (!dt) continue;
      const key = yyyyMmDd(dt);
      const existing = map.get(key);
      if (existing) existing.items.push(p);
      else map.set(key, { day: dt, items: [p] });
    }

    return Array.from(map.values()).sort((a, b) => b.day.getTime() - a.day.getTime());
  }, [filtered]);

  const hasActiveFilters =
    country !== "All" ||
    city !== "All" ||
    activity !== "All" ||
    Boolean(dateFrom) ||
    Boolean(dateTo) ||
    Boolean(q.trim());

  const clearFilters = () => {
    setQ("");
    setCountry("All");
    setCity("All");
    setActivity("All");
    setDateFrom("");
    setDateTo("");
  };

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
          Click “Filters” to narrow by country, city, date range, activity, or keyword.
        </p>
      </div>

      {/* Filters: compact pill + expandable panel */}
      <div className="mt-5">
        <div className="flex flex-wrap items-center gap-2">
          {/* Toggle pill */}
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            className={[
              "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold shadow-sm transition",
              filtersOpen
                ? "bg-[#414141] text-[#f5de88]"
                : "bg-white/70 text-zinc-800 hover:bg-white",
            ].join(" ")}
            aria-expanded={filtersOpen}
            aria-controls="itinerary-filters"
            title="Search & Filters"
          >
            {/* tiny “sliders” icon */}
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M4 21v-7" />
              <path d="M4 10V3" />
              <path d="M12 21v-9" />
              <path d="M12 8V3" />
              <path d="M20 21v-5" />
              <path d="M20 12V3" />
              <path d="M2 14h4" />
              <path d="M10 8h4" />
              <path d="M18 16h4" />
            </svg>

            {filtersOpen ? "Close" : "Filters"}
          </button>

          {/* Active filter chips */}
          <div className="flex flex-wrap items-center gap-2">
            {q.trim() ? <Pill>Search: “{q.trim()}”</Pill> : null}
            {country !== "All" ? <Pill>Country: {country}</Pill> : null}
            {city !== "All" ? <Pill>City: {city}</Pill> : null}
            {activity !== "All" ? <Pill>Activity: {activity}</Pill> : null}
            {dateFrom ? <Pill>From: {dateFrom}</Pill> : null}
            {dateTo ? <Pill>To: {dateTo}</Pill> : null}

            {hasActiveFilters ? (
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-full border bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                Clear
              </button>
            ) : null}
          </div>
        </div>

        {/* Expandable filter panel */}
        {filtersOpen ? (
          <div
            id="itinerary-filters"
            className="mt-3 rounded-2xl border bg-white/70 backdrop-blur p-4 shadow-sm"
          >
            <div className="grid gap-3 md:grid-cols-6">
              {/* Keyword */}
              <label className="md:col-span-2">
                <div className="mb-1 text-[11px] font-semibold tracking-wide text-zinc-500">
                  KEYWORD
                </div>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search titles, excerpts, cities, activities..."
                  className="w-full rounded-xl border bg-white px-3 py-2 text-sm"
                />
              </label>

              {/* Country */}
              <label>
                <div className="mb-1 text-[11px] font-semibold tracking-wide text-zinc-500">
                  COUNTRY
                </div>
                <select
                  value={country}
                  onChange={(e) => {
                    setCountry(e.target.value);
                    setCity("All");
                  }}
                  className="w-full rounded-xl border bg-white px-3 py-2 text-sm"
                >
                  {countryOptions.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </label>

              {/* City */}
              <label>
                <div className="mb-1 text-[11px] font-semibold tracking-wide text-zinc-500">
                  CITY
                </div>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full rounded-xl border bg-white px-3 py-2 text-sm"
                >
                  {cityOptions.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </label>

              {/* Activity */}
              <label>
                <div className="mb-1 text-[11px] font-semibold tracking-wide text-zinc-500">
                  ACTIVITY
                </div>
                <select
                  value={activity}
                  onChange={(e) => setActivity(e.target.value)}
                  className="w-full rounded-xl border bg-white px-3 py-2 text-sm"
                >
                  {activityOptions.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </label>

              {/* Date From */}
              <label>
                <div className="mb-1 text-[11px] font-semibold tracking-wide text-zinc-500">
                  DATE FROM
                </div>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full rounded-xl border bg-white px-3 py-2 text-sm"
                />
              </label>

              {/* Date To */}
              <label>
                <div className="mb-1 text-[11px] font-semibold tracking-wide text-zinc-500">
                  DATE TO
                </div>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full rounded-xl border bg-white px-3 py-2 text-sm"
                />
              </label>

              <div className="md:col-span-6 flex justify-end">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="rounded-xl border bg-[#414141] px-4 py-2 text-sm font-semibold text-[#f5de88] hover:opacity-90"
                >
                  Clear all filters
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Empty state */}
      {!byDay.length ? (
        <div className="mt-5 rounded-2xl border bg-white p-5 text-sm text-zinc-600">
          No matches — try clearing filters or widening your date range.
        </div>
      ) : (
        <div className="mt-6 relative">
          {/* Route line (glow + dashed) */}
          <div className="pointer-events-none absolute left-[14px] top-0 h-full w-px bg-gradient-to-b from-transparent via-zinc-300/80 to-transparent" />
          <div className="pointer-events-none absolute left-[14px] top-0 h-full w-[10px] -translate-x-1/2 bg-gradient-to-b from-transparent via-amber-200/25 to-transparent blur-md" />
          <div className="pointer-events-none absolute left-[14px] top-0 h-full w-px border-l border-dashed border-zinc-300/70" />

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

              // byDay is DESC (newest->oldest). prev is the *newer* day above this one.
              const prev = idx > 0 ? byDay[idx - 1] : null;

              const prevCountry = prev ? primaryCountry(prev.items) : null;
              const prevCity = prev ? primaryCity(prev.items) : null;

              const curCountry = primaryCountry(items);
              const curCity = primaryCity(items);

              // Country banner when we ENTER a new country segment (or first card)
              const showCountryBanner =
                Boolean(curCountry) &&
                (idx === 0 || (primaryCountry(byDay[idx - 1].items) || null) !== curCountry);

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
                <div key={yyyyMmDd(day)} className="space-y-3">
                  {/* Country banner */}
                  {showCountryBanner && curCountry ? <CountryBanner country={curCountry} /> : null}

                  {/* Travel divider (ticket style) */}
                  {showTravelDivider ? (
                    <div className="relative pl-12">
                      <div className="absolute left-[6px] top-2 h-4 w-4 rounded-full border border-white/80" style={dotStyle(curCountry)} />

                      <div className="mb-1 relative rounded-2xl border bg-gradient-to-r from-white via-zinc-50 to-white px-4 py-3 shadow-sm overflow-hidden">
                        {/* perforation */}
                        <div className="pointer-events-none absolute left-0 top-1/2 h-px w-full border-t border-dashed border-zinc-200/80" />
                        {/* subtle color wash */}
                        <div
                          className="pointer-events-none absolute inset-0 opacity-40"
                          style={{
                            background: `linear-gradient(90deg, hsla(${countryHue(prevCountry || "")}, 80%, 65%, 0.10), hsla(${countryHue(curCountry || "")}, 80%, 65%, 0.10))`,
                          }}
                        />

                        <div className="relative flex items-center gap-3">
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
                    {/* colored timeline dot */}
                    <div
                      className="absolute left-[6px] top-6 h-4 w-4 rounded-full border border-white/80"
                      style={dotStyle(curCountry)}
                    />

                    {/* stamp */}
                    <div
                      className="pointer-events-none absolute right-4 top-4 rotate-[-10deg] rounded-xl border px-3 py-1 text-[10px] font-extrabold tracking-[0.18em] uppercase"
                      style={stampStyle(curCountry)}
                    >
                      {curCountry || "On the road"}
                    </div>

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
                                className="rounded-full border px-2.5 py-1 text-xs shadow-sm"
                                style={tagStyle(curCountry)}
                              >
                                {t}
                              </span>
                            ))}

                            {activityTitles.length ? (
                              <span className="rounded-full border bg-[#414141] px-2.5 py-1 text-xs font-semibold text-[#f5de88] shadow-sm">
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

                        {/* RIGHT: Mini map + Stories */}
                        <div className="space-y-4">
                          <MiniMap
                            country={curCountry}
                            city={curCity}
                            label="Route ping"
                          />

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
                    </div>
                  </details>
                </div>
              );
            })}
          </div>
        </div>
      )}
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
