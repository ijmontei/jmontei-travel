"use client";

import React, { useEffect, useMemo, useState } from "react";
import { geoMercator, geoPath } from "d3-geo";
import { feature } from "topojson-client";

type Props = {
  visitedCountries: string[];
  size?: number;
};

function normalizeCountryName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\s+/g, " ");
}

const COUNTRY_ALIASES: Record<string, string> = {
  "usa": "united states of america",
  "united states": "united states of america",
  "uk": "united kingdom",
  "england": "united kingdom",
  "scotland": "united kingdom",
  "wales": "united kingdom",
  "czechia": "czech republic",
  "russia": "russian federation",
  "south korea": "korea, republic of",
  "korea": "korea, republic of",
  "north korea": "korea, democratic people's republic of",
  "vietnam": "viet nam",
  "iran": "iran (islamic republic of)",
  "syria": "syrian arab republic",
  "laos": "lao people's democratic republic",
  "moldova": "moldova, republic of",
  "brunei": "brunei darussalam",
  "hong kong": "china",
  "hongkong": "china",
  "uae": "united arab emirates",
  "vatican": "italy",
  "vatican city": "italy",
  "san marino": "italy",
  "sanmarino": "italy",
};

export function HeroGlobe({ visitedCountries }: Props) {
  const [features, setFeatures] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const res = await fetch("/world-110m.json");
      const topo = await res.json();

      // world-atlas format: objects.countries
      const geo = feature(topo, topo.objects.countries) as any;
      if (mounted) setFeatures(geo.features || []);
    })().catch(() => setFeatures([]));

    return () => {
      mounted = false;
    };
  }, []);

  const visitedSet = useMemo(() => {
    const set = new Set<string>();
    for (const c of visitedCountries || []) {
      const n = normalizeCountryName(c);
      set.add(COUNTRY_ALIASES[n] ?? n);
    }
    return set;
  }, [visitedCountries]);

  // Build projection + path generator (stable per size)
  const { pathGen, viewBox } = useMemo(() => {
    const projection = geoMercator()
      .translate([400, 400])
      .scale(130); // tweak to fit nicely in circle

    const pathGen = geoPath(projection);
    return { pathGen, viewBox: "0 0 800 800" };
  }, []);

  return (
    <div className="relative w-[220px] h-[220px] sm:w-[260px] sm:h-[260px] md:w-[300px] md:h-[300px]">
      <div className="relative h-full w-full overflow-hidden rounded-full border border-white/15">
        <div className="absolute inset-0 globe-spin">
          <svg viewBox={viewBox} className="h-full w-full">
            <g transform="translate(0, 30)">
              {features.map((f, idx) => {
                const name = normalizeCountryName(f?.properties?.name || "");
                const isVisited = visitedSet.has(name);

                return (
                  <path
                    key={idx}
                    d={pathGen(f) || ""}
                    fill={isVisited ? "rgb(230, 192, 123)" : "rgba(255,255,255,0.10)"}
                    stroke="rgba(255,255,255,0.14)"
                    strokeWidth={0.6}
                  />
                );
              })}
            </g>
          </svg>

          <div className="pointer-events-none absolute inset-0 globe-shade" />
          <div className="pointer-events-none absolute inset-0 globe-highlight" />
        </div>
      </div>

      <div className="mt-3 text-center text-sm text-[rgb(var(--muted))]">
        Countries visited
      </div>

      <style jsx>{`
        .globe-spin {
          animation: spin 26s linear infinite;
          transform-origin: 50% 50%;
        }
        @media (prefers-reduced-motion: reduce) {
          .globe-spin {
            animation: none;
          }
        }
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .globe-shade {
          background: radial-gradient(
            circle at 30% 30%,
            rgba(0, 0, 0, 0) 0%,
            rgba(0, 0, 0, 0.15) 55%,
            rgba(0, 0, 0, 0.35) 100%
          );
          mix-blend-mode: multiply;
        }
        .globe-highlight {
          background: radial-gradient(
            circle at 25% 25%,
            rgba(255, 255, 255, 0.18) 0%,
            rgba(255, 255, 255, 0.06) 35%,
            rgba(255, 255, 255, 0) 60%
          );
          mix-blend-mode: screen;
        }
      `}</style>
    </div>
  );
}
