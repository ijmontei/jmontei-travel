"use client";

import React, { useEffect, useMemo, useState } from "react";
import { geoMercator, geoPath } from "d3-geo";
import { feature } from "topojson-client";

type Props = {
  visitedCountries: string[];
};

function normalizeCountryName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\s+/g, " ");
}

// Map your Sanity "country" values -> world-atlas names
const COUNTRY_ALIASES: Record<string, string> = {
  "usa": "united states of america",
  "united states": "united states of america",

  "uk": "united kingdom",
  "united kingdom": "united kingdom",
  "england": "united kingdom",
  "scotland": "united kingdom",
  "wales": "united kingdom",

  "czechia": "czech republic",
  "czech republic": "czech republic",

  "russia": "russian federation",
  "vietnam": "viet nam",
  "iran": "iran (islamic republic of)",
  "syria": "syrian arab republic",
  "laos": "lao people's democratic republic",
  "moldova": "moldova, republic of",
  "brunei": "brunei darussalam",

  // if you want HK to count as China visited
  "hong kong": "china",
  "hongkong": "china",

  "uae": "united arab emirates",

  // microstates often missing in 110m dataset
  "vatican": "italy",
  "vatican city": "italy",
  "san marino": "italy",
  "sanmarino": "italy",

  "south korea": "korea, republic of",
  "korea": "korea, republic of",
  "north korea": "korea, democratic people's republic of",
};

export function HeroGlobe({ visitedCountries }: Props) {
  const [features, setFeatures] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const res = await fetch("/world-110m.json");
      const topo = await res.json();
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

  // Projection tuned to look good inside the circle
  const { pathGen, viewBox } = useMemo(() => {
    const projection = geoMercator()
      .translate([400, 400])
      .scale(130);

    const pathGen = geoPath(projection);
    return { pathGen, viewBox: "0 0 800 800" };
  }, []);

  return (
    <div className="mt-2">
      {/* responsive sizing */}
      <div className="relative w-[220px] h-[220px] sm:w-[260px] sm:h-[260px] md:w-[320px] md:h-[320px]">
        {/* Perspective wrapper */}
        <div className="relative h-full w-full rounded-full overflow-hidden border border-white/15">
          {/* Tilt the whole globe */}
          <div className="absolute inset-0 globe-tilt">
            {/* Spin around the “equator” (Y axis) */}
            <div className="absolute inset-0 globe-spinY">
              <svg viewBox={viewBox} className="h-full w-full">
                <g transform="translate(0, 30)">
                  {features.map((f, idx) => {
                    const name = normalizeCountryName(f?.properties?.name || "");
                    const isVisited = visitedSet.has(name);

                    return (
                      <path
                        key={idx}
                        d={pathGen(f) || ""}
                        fill={isVisited ? "rgb(245, 222, 136)" : "rgba(255,255,255,0.06)"}
                        stroke="rgba(30, 40, 60, 0.65)"   // darker outline so it reads like borders
                        strokeWidth={0.75}
                        vectorEffect="non-scaling-stroke"
                      />
                    );
                  })}
                </g>
              </svg>

              {/* Sphere shading to sell the globe */}
              <div className="pointer-events-none absolute inset-0 globe-shade" />
              <div className="pointer-events-none absolute inset-0 globe-highlight" />
              <div className="pointer-events-none absolute inset-0 globe-vignette" />
            </div>
          </div>
        </div>

        <div className="mt-3 text-center text-sm text-[rgb(var(--muted))]">
          Countries visited
        </div>
      </div>

      <style jsx>{`
        /* Add depth */
        .globe-tilt {
          transform: perspective(900px) rotateZ(-16deg) rotateX(10deg);
          transform-style: preserve-3d;
        }

        /* Equator spin: rotate around Y axis */
        .globe-spinY {
          animation: spinY 18s linear infinite;
          transform-style: preserve-3d;
          will-change: transform;
        }

        @media (prefers-reduced-motion: reduce) {
          .globe-spinY {
            animation: none;
          }
        }

        @keyframes spinY {
          from {
            transform: rotateY(0deg);
          }
          to {
            transform: rotateY(360deg);
          }
        }

        /* Shading layers */
        .globe-shade {
          background: radial-gradient(
            circle at 30% 35%,
            rgba(0, 0, 0, 0) 0%,
            rgba(0, 0, 0, 0.14) 55%,
            rgba(0, 0, 0, 0.34) 100%
          );
          mix-blend-mode: multiply;
        }

        .globe-highlight {
          background: radial-gradient(
            circle at 25% 25%,
            rgba(255, 255, 255, 0.16) 0%,
            rgba(255, 255, 255, 0.06) 35%,
            rgba(255, 255, 255, 0) 60%
          );
          mix-blend-mode: screen;
        }

        .globe-vignette {
          background: radial-gradient(
            circle at 50% 50%,
            rgba(0, 0, 0, 0) 62%,
            rgba(0, 0, 0, 0.18) 100%
          );
          mix-blend-mode: multiply;
        }
      `}</style>
    </div>
  );
}
