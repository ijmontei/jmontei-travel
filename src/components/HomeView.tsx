"use client";

import { useMemo, useState } from "react";
import type { Post } from "@/lib/types";
import { PostCard } from "@/components/PostCard";
import { CountryAccordion } from "@/components/CountryAccordion";
import { HeroGlobe } from "@/components/HeroGlobe";
import { Reveal } from "@/components/Reveal";
import type React from "react";
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

function formatShortDate(dt: Date) {
  return dt.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatShortDateWithYear(dt: Date) {
  return dt.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function uniq<T>(arr: T[]) {
  return Array.from(new Set(arr));
}

function hueFromString(input: string) {
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) % 360;
  return h;
}
function accentHueFromCountry(country?: string | null) {
  return hueFromString((country || "unknown").toLowerCase());
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

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border bg-white/70 px-2.5 py-1 text-xs text-zinc-700 shadow-sm">
      {children}
    </span>
  );
}

function AccentDot({ hue }: { hue: number }) {
  return (
    <span
      className="inline-block h-2.5 w-2.5 rounded-full"
      style={{
        background: `radial-gradient(circle at 30% 30%, hsla(${hue}, 85%, 66%, 1), hsla(${hue}, 85%, 42%, 1))`,
        boxShadow: `0 0 0 3px hsla(${hue}, 85%, 60%, 0.14), 0 10px 22px hsla(${hue}, 85%, 45%, 0.12)`,
      }}
      aria-hidden="true"
    />
  );
}

function rangeLabel(d1: Date, d2: Date, includeYear: boolean) {
  if (d1.getTime() === d2.getTime()) {
    return includeYear ? formatShortDateWithYear(d1) : formatShortDate(d1);
  }
  if (includeYear) {
    return `${formatShortDateWithYear(d1)} – ${formatShortDateWithYear(d2)}`;
  }
  return `${formatShortDate(d1)} – ${formatShortDate(d2)}`;
}

function dateRangeFromPosts(items: Post[]) {
  const times = items
    .map((p: any) => safeDate(p.publishedAt)?.getTime())
    .filter((t): t is number => typeof t === "number" && Number.isFinite(t))
    .sort((a, b) => a - b);

  if (!times.length) return null;
  const start = new Date(times[0]);
  const end = new Date(times[times.length - 1]);
  return { start, end };
}

/** Slim travel / transit row */
function TravelRow({
  kind,
  hue,
  title,
  subtitle,
}: {
  kind: "travel" | "transit";
  hue: number;
  title: string;
  subtitle?: string | null;
}) {
  return (
    <div className="relative pl-12">
      <div className="absolute left-[8px] top-3">
        <AccentDot hue={hue} />
      </div>

      <div className="absolute left-[14px] top-0 h-full w-px border-l border-dashed border-zinc-300/70" />

      <div
        className="
          flex items-center gap-3
          rounded-xl
          px-4 py-3
          text-sm
          shadow-sm
          ring-1 ring-white/10
          bg-[#ced5d9]
          text-[#122733]
        "
      >

        <span
          className="inline-flex h-8 w-8 items-center justify-center rounded-full"

          style={{
            background: `radial-gradient(circle at 30% 30%, hsla(${hue}, 70%, 55%, 0.9), hsla(${hue}, 70%, 35%, 0.9))`,
            boxShadow: "0 0 0 1px rgba(255,255,255,0.15)",
            color: "#F3F7F4",
          }}
        >
          {kind === "travel" ? <PlaneIcon className="h-4 w-4" /> : <CarIcon className="h-4 w-4" />}
        </span>

        <div className="min-w-0">
         <div className="text-[11px] font-semibold tracking-wide text-[#9ED3B6]">
            {kind === "travel" ? "TRAVEL" : "TRANSIT"}
          </div>
          <div className="truncate font-semibold text-[#122733]">{title}</div>
          {subtitle ? (
            <div className="truncate text-xs text-[#A9C2B4]">
              {subtitle}
            </div>
          ) : null}
          <div
  aria-hidden
  className="pointer-events-none absolute inset-0 rounded-xl opacity-[0.04]"
  style={{
    backgroundImage:
      "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)",
    backgroundSize: "18px 18px",
  }}
/>

          

        </div>
      </div>
    </div>
  );
}

/** ---------- Itinerary Panel (Country → City → Days) ---------- */
type DayGroup = { key: string; day: Date; items: Post[] };
type CityGroup = {
  city: string;
  days: DayGroup[];
  accommodations: { names: string[]; types: string[]; links: string[] };
  allItems: Post[];
  nights: number;
  range: { start: Date; end: Date } | null;
};

function normText(v?: string | null) {
  return (v ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}
function normLink(v?: string | null) {
  return (v ?? "").trim().toLowerCase().replace(/\/+$/, "");
}

function groupPostsByAccommodation(items: Post[]) {
  const m = new Map<string, { acc: any; posts: Post[]; firstDate: number }>();

  for (const p of items) {
    const acc = (p as any).accommodation ?? null;

    const rawName = acc?.name ?? "";
    const rawType = acc?.type ?? "";
    const rawLink = acc?.link ?? "";

    const name = normText(rawName);
    const type = normText(rawType);
    const link = normLink(rawLink);

    const key = name ? `name:${name}` : link ? `link:${link}` : "__no_acc__";

    const ts = safeDate((p as any).publishedAt)?.getTime() ?? 0;

    if (!m.has(key)) m.set(key, { acc: { ...acc }, posts: [], firstDate: ts });
    const g = m.get(key)!;

    g.posts.push(p);
    g.firstDate = Math.min(g.firstDate, ts);

    // Keep “best” acc info we’ve seen (prefer first non-empty)
    if (!g.acc?.name && rawName) g.acc.name = rawName;
    if (!g.acc?.type && rawType) g.acc.type = rawType;
    if (!g.acc?.link && rawLink) g.acc.link = rawLink;

    // Also prefer a type if the group has a name but this entry has it
    if (name && !g.acc?.type && type) g.acc.type = rawType;
    if (name && !g.acc?.link && link) g.acc.link = rawLink;
  }

  const groups = Array.from(m.values()).map((g) => ({
    ...g,
    posts: [...g.posts].sort(
      (a: any, b: any) =>
        (safeDate(a.publishedAt)?.getTime() ?? 0) - (safeDate(b.publishedAt)?.getTime() ?? 0)
    ),
  }));

  groups.sort((a, b) => a.firstDate - b.firstDate);
  return groups;
}

type CountryGroup = {
  country: string;
  hue: number;
  cities: CityGroup[];
  allItems: Post[];
  range: { start: Date; end: Date } | null;
};

function ItineraryPanel({ posts }: { posts: Post[] }) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [country, setCountry] = useState<string>("All");
  const [city, setCity] = useState<string>("All");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [q, setQ] = useState<string>("");

  const countryOptions = useMemo(() => {
    return ["All", ...uniq(posts.map((p) => (p.country || "").trim()).filter(Boolean) as string[])].sort((a, b) =>
      a.localeCompare(b)
    );
  }, [posts]);

  const cityOptions = useMemo(() => {
    const base = country === "All" ? posts : posts.filter((p) => (p.country || "").trim() === country);
    return ["All", ...uniq(base.map((p: any) => (p.city || "").trim()).filter(Boolean) as string[])].sort((a, b) =>
      a.localeCompare(b)
    );
  }, [posts, country]);

  const filtered = useMemo(() => {
    return posts.filter((p: any) => {
      const dt = safeDate(p.publishedAt);
      if (!dt) return false;

      const ctry = (p.country || "").trim();
      const cty = (p.city || "").trim();

      if (country !== "All" && ctry !== country) return false;
      if (city !== "All" && cty !== city) return false;

      if (dateFrom) {
        const from = new Date(`${dateFrom}T00:00:00`);
        if (dt < from) return false;
      }
      if (dateTo) {
        const to = new Date(`${dateTo}T23:59:59`);
        if (dt > to) return false;
      }

      if (q.trim()) {
        const hay = [p.title, p.excerpt, p.bodyText, ctry, cty]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q.trim().toLowerCase())) return false;
      }

      return true;
    });
  }, [posts, country, city, dateFrom, dateTo, q]);

  const hasActiveFilters =
    country !== "All" || city !== "All" || Boolean(dateFrom) || Boolean(dateTo) || Boolean(q.trim());

  const clearFilters = () => {
    setQ("");
    setCountry("All");
    setCity("All");
    setDateFrom("");
    setDateTo("");
  };

  const grouped = useMemo<CountryGroup[]>(() => {
    const ordered = [...filtered]
      .filter((p: any) => Boolean(safeDate(p.publishedAt)))
      .sort(
        (a: any, b: any) =>
          (safeDate(a.publishedAt)?.getTime() ?? 0) - (safeDate(b.publishedAt)?.getTime() ?? 0)
      );

    const countryMap = new Map<string, { all: Post[]; cityMap: Map<string, Post[]> }>();

    for (const p of ordered) {
      const ctry = ((p as any).country || "Other").trim() || "Other";
      const cty = (((p as any).city || "Unknown City").trim() || "Unknown City") as string;

      if (!countryMap.has(ctry)) countryMap.set(ctry, { all: [], cityMap: new Map() });
      const c = countryMap.get(ctry)!;
      c.all.push(p);

      if (!c.cityMap.has(cty)) c.cityMap.set(cty, []);
      c.cityMap.get(cty)!.push(p);
    }

    const out: CountryGroup[] = [];

    for (const [ctry, payload] of countryMap.entries()) {
      const hue = accentHueFromCountry(ctry);
      const cities: CityGroup[] = [];

      for (const [cty, cityPosts] of payload.cityMap.entries()) {
        const dayMap = new Map<string, { day: Date; items: Post[] }>();

        for (const p of cityPosts) {
          const dt = safeDate((p as any).publishedAt as string);
          if (!dt) continue;
          const key = yyyyMmDd(dt);
          if (!dayMap.has(key)) dayMap.set(key, { day: dt, items: [] });
          dayMap.get(key)!.items.push(p);
        }

        const days = Array.from(dayMap.entries())
          .map(([key, v]) => ({
            key,
            day: v.day,
            items: [...v.items].sort(
              (a: any, b: any) =>
                (safeDate(a.publishedAt)?.getTime() ?? 0) - (safeDate(b.publishedAt)?.getTime() ?? 0)
            ),
          }))
          .sort((a, b) => a.day.getTime() - b.day.getTime());

        const cityRange = dateRangeFromPosts(cityPosts);
        const nights = days.length;

        cities.push({
          city: cty,
          days,
          accommodations: {
            names: [],
            types: [],
            links: [],
          },
          allItems: cityPosts,
          nights,
          range: cityRange,
        });
      }

      out.push({
        country: ctry,
        hue,
        cities,
        allItems: payload.all,
        range: dateRangeFromPosts(payload.all),
      });
    }

    return out;
  }, [filtered]);

  return (
    <section className="relative mt-6 overflow-hidden rounded-3xl border bg-gradient-to-b from-zinc-50/90 via-white/70 to-zinc-100/60 p-4 sm:p-5">
      {/* subtle texture overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(0,0,0,0.18) 1px, transparent 0)",
          backgroundSize: "18px 18px",
        }}
        aria-hidden="true"
      />
      {/* content wrapper sits ABOVE texture */}
    <div className="relative">
      <div className="flex flex-col gap-2">
        <h3 className="text-xl font-semibold tracking-tight">Itinerary</h3>
      </div>

      {/* Filters */}
      <div className="mt-5">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            className={[
              "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold shadow-sm transition",
              filtersOpen ? "bg-[#414141] text-[#f5de88]" : "bg-white/70 text-zinc-800 hover:bg-white",
            ].join(" ")}
            aria-expanded={filtersOpen}
            aria-controls="itinerary-filters"
            title="Search & Filters"
          >
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

          <div className="flex flex-wrap items-center gap-2">
            {q.trim() ? <Pill>Search: “{q.trim()}”</Pill> : null}
            {country !== "All" ? <Pill>Country: {country}</Pill> : null}
            {city !== "All" ? <Pill>City: {city}</Pill> : null}
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

        {filtersOpen ? (
          <div id="itinerary-filters" className="mt-3 rounded-2xl border bg-white/70 backdrop-blur p-4 shadow-sm">
            <div className="grid gap-3 md:grid-cols-6">
              <label className="md:col-span-2">
                <div className="mb-1 text-[11px] font-semibold tracking-wide text-zinc-500">KEYWORD</div>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search titles, excerpts, cities..."
                  className="w-full rounded-xl border bg-white px-3 py-2 text-sm"
                />
              </label>

              <label>
                <div className="mb-1 text-[11px] font-semibold tracking-wide text-zinc-500">COUNTRY</div>
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

              <label>
                <div className="mb-1 text-[11px] font-semibold tracking-wide text-zinc-500">CITY</div>
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

              <label>
                <div className="mb-1 text-[11px] font-semibold tracking-wide text-zinc-500">DATE FROM</div>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full rounded-xl border bg-white px-3 py-2 text-sm"
                />
              </label>

              <label>
                <div className="mb-1 text-[11px] font-semibold tracking-wide text-zinc-500">DATE TO</div>
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

      {!grouped.length ? (
        <div className="mt-5 rounded-2xl border bg-white p-5 text-sm text-zinc-600">
          No matches — try clearing filters or widening your date range.
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {grouped.map((cg, cIdx) => {
            const prevCountry = cIdx > 0 ? grouped[cIdx - 1]?.country : null;
            const showCountryTravel = Boolean(prevCountry) && prevCountry !== cg.country;
            const countryRangeLabel = cg.range ? rangeLabel(cg.range.start, cg.range.end, true) : null;

            return (
              <div key={`country-${cg.country}`} className="space-y-3">
                {showCountryTravel ? (
                  <TravelRow kind="travel" hue={cg.hue} title={`Flight to ${cg.country}`} subtitle={`from ${prevCountry}`} />
                ) : null}

                {/* ✅ 2) Slightly translucent large containers */}
                <details className="group rounded-2xl border bg-zinc-50/80 backdrop-blur shadow-sm overflow-hidden">
                  <summary className="cursor-pointer list-none px-5 py-4">
                    <div className="flex items-center gap-3">
                      <AccentDot hue={cg.hue} />

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="text-sm font-semibold text-zinc-900 truncate">{cg.country}</div>

                          {countryRangeLabel ? (
                            <span
                              className="rounded-full border px-2.5 py-1 text-[11px] font-semibold shadow-sm"
                              style={{
                                background: `linear-gradient(135deg, hsla(${cg.hue}, 70%, 92%, 0.92), hsla(${cg.hue}, 70%, 96%, 0.92))`,
                                borderColor: `hsla(${cg.hue}, 60%, 55%, 0.22)`,
                                color: `hsla(${cg.hue}, 30%, 18%, 0.95)`,
                              }}
                            >
                              {countryRangeLabel}
                            </span>
                          ) : null}
                        </div>

                        <div className="text-xs text-zinc-500">
                          {cg.cities.length} cit{cg.cities.length === 1 ? "y" : "ies"} · {cg.allItems.length} post
                          {cg.allItems.length === 1 ? "" : "s"}
                        </div>
                      </div>

                      <span className="ml-auto inline-flex items-center gap-1 rounded-full border bg-zinc-50 px-2 py-0.5 text-xs text-zinc-700">
                        <span className="group-open:hidden">Expand</span>
                        <span className="hidden group-open:inline">Collapse</span>
                        <span className="ml-1 transition-transform duration-200 group-open:rotate-180" aria-hidden>
                          ▾
                        </span>
                      </span>
                    </div>
                  </summary>

                  <div className="border-t bg-white/40 px-5 py-5 space-y-4">
                    {cg.cities.map((cityGroup, cityIdx) => {
                      const prevCity = cityIdx > 0 ? cg.cities[cityIdx - 1]?.city : null;
                      const showTransit = Boolean(prevCity) && prevCity !== cityGroup.city;

                      const cityRangeLabel = cityGroup.range ? rangeLabel(cityGroup.range.start, cityGroup.range.end, false) : null;
                      const nightsLabel = `${cityGroup.nights} night${cityGroup.nights === 1 ? "" : "s"}`;

                      return (
                        <div key={`city-${cg.country}-${cityGroup.city}`} className="space-y-3">
                          {showTransit ? (
                            <TravelRow kind="transit" hue={cg.hue} title={`${prevCity} → ${cityGroup.city}`}/>
                          ) : null}

                          <details className="group/city rounded-2xl border bg-zinc-50/80 backdrop-blur shadow-sm overflow-hidden">
                            <summary className="cursor-pointer list-none px-4 py-4">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <div className="text-sm font-semibold text-zinc-900">{cityGroup.city}</div>

                                    {cityRangeLabel ? (
                                      <span
                                        className="rounded-full border px-2.5 py-1 text-[11px] font-semibold shadow-sm"
                                        style={{
                                          background: `linear-gradient(135deg, hsla(${cg.hue}, 70%, 92%, 0.92), hsla(${cg.hue}, 70%, 96%, 0.92))`,
                                          borderColor: `hsla(${cg.hue}, 60%, 55%, 0.22)`,
                                          color: `hsla(${cg.hue}, 30%, 18%, 0.95)`,
                                        }}
                                      >
                                        {cityRangeLabel}
                                      </span>
                                    ) : null}

                                    <span className="rounded-full border bg-white px-2.5 py-1 text-[11px] font-semibold text-zinc-700 shadow-sm">
                                      {nightsLabel}
                                    </span>
                                  </div>
                                </div>

                                <span className="shrink-0 inline-flex items-center gap-1 rounded-full border bg-white/40 px-2 py-0.5 text-xs text-zinc-600">
                                  <span className="group-open/city:hidden">Expand</span>
                                  <span className="hidden group-open/city:inline">Collapse</span>
                                  <span className="transition-transform duration-200 group-open/city:rotate-180" aria-hidden>
                                    ▾
                                  </span>
                                </span>
                              </div>
                            </summary>

                            <div className="border-t px-4 pb-5 pt-5">

                              <div className="space-y-3">
                                {(() => {
                                  const accGroups = groupPostsByAccommodation(cityGroup.allItems);

                                  return (
                                    <div className="space-y-3">
                                      {accGroups.map(({ acc, posts }, gi) => {
                                        const accName = (acc?.name || "").trim();
                                        const accType = (acc?.type || "").trim();
                                        const accLink = (acc?.link || "").trim();

                                        const hasAcc = Boolean(accName || accType || accLink);
                                        const chipLabel = ["Accommodation:", accName || "View", accType ? `• ${accType}` : ""]
                                          .filter(Boolean)
                                          .join(" ");

                                        return (
                                          // ✅ 4) Remove inner borders: use ring instead
                                          <div
                                            key={`acc-group-${gi}`}
                                            className="relative overflow-hidden rounded-2xl border bg-white/45 shadow-sm"
                                          >
                                            <div
                                              className="absolute left-0 top-0 h-full w-1"
                                              style={{ background: `hsla(${cg.hue}, 85%, 45%, 0.7)` }}
                                              aria-hidden
                                            />

                                            <div className="pl-3">
                                              {/* ✅ 5) Zebra rows (break up white + more scannable) */}
                                              <div className="overflow-hidden rounded-2xl">
                                                {posts.map((p, idx) => {
                                                  const dt = safeDate((p as any).publishedAt);
                                                  return (
                                                    <div
                                                      key={p._id}
                                                      className={[
                                                        "flex items-center justify-between gap-4 px-4 py-3 transition",
                                                        idx % 2 === 0 ? "bg-white/40" : "bg-white/10",
                                                        "hover:bg-white/60",
                                                      ].join(" ")}
                                                    >
                                                      <div className="min-w-0">
                                                        <div className="truncate text-sm font-semibold text-zinc-900">{p.title}</div>

                                                        <div className="mt-1 flex items-center gap-2 text-[11px] text-zinc-500">
                                                          <span
                                                            className="inline-flex h-1.5 w-1.5 rounded-full"
                                                            style={{ background: `hsla(${cg.hue}, 85%, 45%, 0.9)` }}
                                                            aria-hidden
                                                          />
                                                          <span className="truncate">{dt ? formatDayLabel(dt) : ""}</span>
                                                        </div>
                                                      </div>

                                                      <Link
                                                        href={`/posts/${p.slug}`}
                                                        className="shrink-0 rounded-full border bg-[#414141] px-3 py-1 text-xs font-semibold text-[#f5de88] hover:opacity-90"
                                                      >
                                                        Read Post →
                                                      </Link>
                                                    </div>
                                                  );
                                                })}
                                              </div>

                                              {/* ✅ 6) Accommodation footer feels like a footer (lighter) */}
                                              {hasAcc && accLink ? (
                                                <div className="border-t border-black/5 bg-zinc-50/50 px-4 py-3 flex justify-end">
                                                  <a
                                                    href={accLink}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                                                    title={accName || "Accommodation"}
                                                  >
                                                    {chipLabel} ↗
                                                  </a>
                                                </div>
                                              ) : null}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>
                          </details>
                        </div>
                      );
                    })}
                  </div>
                </details>
              </div>
            );
          })}
        </div>
      )}
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
          new Date(a.publishedAt as string).getTime() - new Date(b.publishedAt as string).getTime()
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
            <HeroGlobe visitedCountries={visitedCountries} currentCountry={currentCountry} routeCountries={routeCountries} />
          </div>

          <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-[hsl(var(--text))]">Stories and photos from the road.</h2>
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
                    country={p.city && p.country ? `${p.city}, ${p.country}` : p.city || p.country}
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
