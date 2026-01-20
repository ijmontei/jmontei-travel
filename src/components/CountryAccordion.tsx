"use client";

import { useMemo, useState } from "react";
import type { Post } from "@/lib/types";
import { PostCard } from "@/components/PostCard";

// Add/extend as you go. Fallback is 🌍.
const FLAG_BY_COUNTRY: Record<string, string> = {
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
  return FLAG_BY_COUNTRY[key] ?? "🌍";
}

export function CountryAccordion({
  grouped,
}: {
  grouped: { country: string; posts: Post[] }[];
}) {
  const [open, setOpen] = useState<Record<string, boolean>>({});

  // Optional: keep consistent ordering & avoid re-renders
  const sorted = useMemo(() => {
    return [...grouped].sort((a, b) => a.country.localeCompare(b.country));
  }, [grouped]);

  return (
    <div className="space-y-4">
      {sorted.map(({ country, posts }) => {
        const isOpen = !!open[country];
        const countLabel = `${posts.length} post${posts.length === 1 ? "" : "s"}`;

        return (
          <section
            key={country}
            className={[
              "rounded-3xl border overflow-hidden bg-white",
              "border-black/10 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.25)]",
            ].join(" ")}
          >
            <button
              type="button"
              onClick={() => setOpen((p) => ({ ...p, [country]: !p[country] }))}
              className="w-full px-5 py-4 text-left"
              aria-expanded={isOpen}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-lg" aria-hidden="true">
                    {flagFor(country)}
                  </span>

                  <div className="min-w-0">
                    <div className="flex items-baseline gap-3">
                      <span className="truncate text-base font-semibold text-zinc-900">
                        {country}
                      </span>
                      <span className="shrink-0 text-xs text-zinc-500">
                        {countLabel}
                      </span>
                    </div>

                    {/* subtle divider line */}
                    <div className="mt-2 h-px w-40 max-w-full bg-gradient-to-r from-amber-300/70 via-amber-200/20 to-transparent" />
                  </div>
                </div>

                <span className="shrink-0 text-sm text-zinc-500">
                  <span
                    className={[
                      "inline-block transition-transform duration-300",
                      isOpen ? "rotate-180" : "rotate-0",
                    ].join(" ")}
                  >
                    ▼
                  </span>
                </span>
              </div>
            </button>

            {/* Animated panel */}
            <div
              className={[
                "grid transition-[grid-template-rows] duration-300 ease-out",
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
              ].join(" ")}
            >
              <div className="overflow-hidden">
                <div className="px-5 pb-6">
                  <div
                    className={[
                      "pt-2 transition-all duration-300",
                      isOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1",
                    ].join(" ")}
                  >
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
          </section>
        );
      })}
    </div>
  );
}
