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

  "hong kong": "china",
  "hongkong": "china",

  "uae": "united arab emirates",

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

  // Build projection + path generator
  const { pathGen, viewBox } = useMemo(() => {
    // A centered mercator that fits well
    const projection = geoMercator()
      .translate([500, 280])
      .scale(160);

    const pathGen = geoPath(projection);
    return { pathGen, viewBox: "0 0 1000 560" };
  }, []);

  const stroke = "rgba(30, 40, 60, 0.55)";
  const unvisitedFill = "rgba(255,255,255,0.06)";
  const visitedFill = "rgb(245, 222, 136)";

  return (
    <div className="mt-2">
      {/* responsive sizing */}
      <div className="relative w-[220px] h-[220px] sm:w-[260px] sm:h-[260px] md:w-[320px] md:h-[320px]">
        <div className="relative h-full w-full overflow-hidden rounded-full border border-white/15">
          {/* slight "tilt" without 3D artifacts */}
          <div className="absolute inset-0 globe-tilt">
            {/* moving texture strip */}
            <div className="absolute inset-0 globe-texture">
              {/* We render the map twice side-by-side to allow seamless scrolling */}
              <div className="absolute top-1/2 -translate-y-1/2 left-0 flex h-full w-[200%]">
                {[0, 1].map((dup) => (
                  <svg
                    key={dup}
                    viewBox={viewBox}
                    className="h-full w-1/2"
                    aria-hidden="true"
                  >
                    {features.map((f, idx) => {
                      const name = normalizeCountryName(f?.properties?.name || "");
                      const isVisited = visitedSet.has(name);

                      return (
                        <path
                          key={`${dup}-${idx}`}
                          d={pathGen(f) || ""}
                          fill={isVisited ? visitedFill : unvisitedFill}
                          stroke={stroke}
                          strokeWidth={0.8}
                          vectorEffect="non-scaling-stroke"
                        />
                      );
                    })}
                  </svg>
                ))}
              </div>
            </div>

            {/* Sphere shading layers */}
            <div className="pointer-events-none absolute inset-0 globe-terminator" />
            <div className="pointer-events-none absolute inset-0 globe-highlight" />
            <div className="pointer-events-none absolute inset-0 globe-vignette" />
          </div>
        </div>

        <div className="mt-3 text-center text-sm text-[rgb(var(--muted))]">
          Countries visited
        </div>
      </div>

      <style jsx>{`
        /* Slight 2D tilt to mimic an axial tilt without turning into a “paper disc” */
        .globe-tilt {
          transform: rotate(-10deg);
          transform-origin: 50% 50%;
        }

        /* Texture scroll = “equator spin” illusion */
        .globe-texture {
          animation: scrollX 22s linear infinite;
          will-change: transform;
        }

        @media (prefers-reduced-motion: reduce) {
          .globe-texture {
            animation: none;
          }
        }

        /* Move the double-width strip left by half its width for seamless loop */
        @keyframes scrollX {
          from {
            transform: translateX(0%);
          }
          to {
            transform: translateX(-50%);
          }
        }

        /* Terminator: darkens the far side like a sphere */
        .globe-terminator {
          background: radial-gradient(
            circle at 32% 40%,
            rgba(0, 0, 0, 0) 0%,
            rgba(0, 0, 0, 0.10) 52%,
            rgba(0, 0, 0, 0.34) 100%
          );
          mix-blend-mode: multiply;
        }

        /* Soft specular highlight */
        .globe-highlight {
          background: radial-gradient(
            circle at 26% 28%,
            rgba(255, 255, 255, 0.18) 0%,
            rgba(255, 255, 255, 0.06) 35%,
            rgba(255, 255, 255, 0) 60%
          );
          mix-blend-mode: screen;
        }

        /* Edge vignette */
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
