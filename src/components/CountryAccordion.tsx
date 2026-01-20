"use client";

import { useMemo, useState } from "react";
import type { Post } from "@/lib/types";
import { PostCard } from "@/components/PostCard";

// Simple map for common destinations.
// Add countries as you travel; fallback is 🌍.
const FLAG_MAP: Record<string, string> = {
  // ===== Europe =====
  Albania: "🇦🇱",
  Andorra: "🇦🇩",
  Austria: "🇦🇹",
  Belarus: "🇧🇾",
  Belgium: "🇧🇪",
  Bosnia: "🇧🇦",
  Bulgaria: "🇧🇬",
  Croatia: "🇭🇷",
  Cyprus: "🇨🇾",
  Czechia: "🇨🇿",
  "Czech Republic": "🇨🇿",
  Denmark: "🇩🇰",
  Estonia: "🇪🇪",
  Finland: "🇫🇮",
  France: "🇫🇷",
  Germany: "🇩🇪",
  Greece: "🇬🇷",
  Hungary: "🇭🇺",
  Iceland: "🇮🇸",
  Ireland: "🇮🇪",
  Italy: "🇮🇹",
  Latvia: "🇱🇻",
  Liechtenstein: "🇱🇮",
  Lithuania: "🇱🇹",
  Luxembourg: "🇱🇺",
  Malta: "🇲🇹",
  Moldova: "🇲🇩",
  Monaco: "🇲🇨",
  Montenegro: "🇲🇪",
  Netherlands: "🇳🇱",
  Norway: "🇳🇴",
  Poland: "🇵🇱",
  Portugal: "🇵🇹",
  Romania: "🇷🇴",
  Russia: "🇷🇺",
  SanMarino: "🇸🇲",
  Serbia: "🇷🇸",
  Slovakia: "🇸🇰",
  Slovenia: "🇸🇮",
  Spain: "🇪🇸",
  Sweden: "🇸🇪",
  Switzerland: "🇨🇭",
  Ukraine: "🇺🇦",
  "United Kingdom": "🇬🇧",
  UK: "🇬🇧",
  England: "🏴",
  Scotland: "🏴",
  Wales: "🏴",
  Vatican: "🇻🇦",

  // ===== Asia =====
  Afghanistan: "🇦🇫",
  Armenia: "🇦🇲",
  Azerbaijan: "🇦🇿",
  Bahrain: "🇧🇭",
  Bangladesh: "🇧🇩",
  Bhutan: "🇧🇹",
  Brunei: "🇧🇳",
  Cambodia: "🇰🇭",
  China: "🇨🇳",
  Georgia: "🇬🇪",
  HongKong: "🇭🇰",
  India: "🇮🇳",
  Indonesia: "🇮🇩",
  Iran: "🇮🇷",
  Iraq: "🇮🇶",
  Israel: "🇮🇱",
  Japan: "🇯🇵",
  Jordan: "🇯🇴",
  Kazakhstan: "🇰🇿",
  Kuwait: "🇰🇼",
  Kyrgyzstan: "🇰🇬",
  Laos: "🇱🇦",
  Lebanon: "🇱🇧",
  Malaysia: "🇲🇾",
  Maldives: "🇲🇻",
  Mongolia: "🇲🇳",
  Myanmar: "🇲🇲",
  Nepal: "🇳🇵",
  "North Korea": "🇰🇵",
  Oman: "🇴🇲",
  Pakistan: "🇵🇰",
  Philippines: "🇵🇭",
  Qatar: "🇶🇦",
  "Saudi Arabia": "🇸🇦",
  Singapore: "🇸🇬",
  "South Korea": "🇰🇷",
  Korea: "🇰🇷",
  "Sri Lanka": "🇱🇰",
  Syria: "🇸🇾",
  Taiwan: "🇹🇼",
  Tajikistan: "🇹🇯",
  Thailand: "🇹🇭",
  Turkey: "🇹🇷",
  Turkmenistan: "🇹🇲",
  UAE: "🇦🇪",
  "United Arab Emirates": "🇦🇪",
  Uzbekistan: "🇺🇿",
  Vietnam: "🇻🇳",
  Yemen: "🇾🇪",

  // ===== Americas / Others you already had =====
  USA: "🇺🇸",
  "United States": "🇺🇸",
  Canada: "🇨🇦",
  Mexico: "🇲🇽",
  Brazil: "🇧🇷",
  Argentina: "🇦🇷",
  Chile: "🇨🇱",
  Peru: "🇵🇪",
  Colombia: "🇨🇴",
  Australia: "🇦🇺",
  "New Zealand": "🇳🇿",
  Egypt: "🇪🇬",
  Morocco: "🇲🇦",
  "South Africa": "🇿🇦",
};


function flagFor(country: string) {
  const key = country.trim();
  return FLAG_MAP[key] ?? FLAG_MAP[key.replace(/\s+/g, "")] ?? "🌍";
}

export function CountryAccordion({
  grouped,
}: {
  grouped: { country: string; posts: Post[] }[];
}) {
  const [open, setOpen] = useState<Record<string, boolean>>({});

  // Optional: open the first country by default (feels nicer)
  const groupedWithDefaultOpen = useMemo(() => {
    if (!grouped?.length) return grouped;
    return grouped;
  }, [grouped]);

  return (
    <div className="space-y-4">
      {groupedWithDefaultOpen.map(({ country, posts }, idx) => {
        const isOpen = open[country] ?? (idx === 0 && open[country] !== false);

        return (
          <div
            key={country}
            className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden shadow-sm"
          >
            <button
              type="button"
              onClick={() => setOpen((p) => ({ ...p, [country]: !isOpen }))}
              className="w-full px-5 py-4 text-left transition hover:bg-black/[0.03]"
              aria-expanded={isOpen}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="text-lg" aria-hidden>
                      {flagFor(country)}
                    </span>
                    <span className="truncate text-base font-semibold text-[hsl(var(--text))]">
                      {country}
                    </span>

                    <span className="shrink-0 rounded-full border border-[hsl(var(--border))] bg-white/70 px-2.5 py-1 text-xs text-[hsl(var(--muted))]">
                      {posts.length} post{posts.length === 1 ? "" : "s"}
                    </span>
                  </div>

                  <div className="mt-2 h-px w-full bg-[hsl(var(--border))]/70" />
                </div>

                <span
                  className={[
                    "shrink-0 text-zinc-500 transition-transform duration-200",
                    isOpen ? "rotate-180" : "rotate-0",
                  ].join(" ")}
                  aria-hidden
                >
                  ▼
                </span>
              </div>
            </button>

            {/* Smooth accordion without extra libs */}
            <div
              className={[
                "grid transition-all duration-300 ease-out",
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
              ].join(" ")}
            >
              <div className="overflow-hidden">
                <div className="px-5 pb-5 pt-2">
                  <div className="grid gap-6 md:grid-cols-2">
                    {posts.map((p) => (
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
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
