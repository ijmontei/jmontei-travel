"use client";

import React, { useEffect, useMemo, useState } from "react";
import { geoOrthographic, geoPath } from "d3-geo";
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

  // If you want HK to count as China visited:
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
  const [rotation, setRotation] = useState(0);

  // responsive size
  const size = 320; // internal drawing size (we scale with CSS)
  const center = size / 2;

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

  // spin
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      setRotation((r) => (r + 0.18) % 360); // speed
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const visitedSet = useMemo(() => {
    const set = new Set<string>();
    for (const c of visitedCountries || []) {
      const n = normalizeCountryName(c);
      set.add(COUNTRY_ALIASES[n] ?? n);
    }
    return set;
  }, [visitedCountries]);

  const projection = useMemo(() => {
    // Orthographic = real globe projection
    return geoOrthographic()
      .scale(size * 0.42)
      .translate([center, center])
      .rotate([0, -18]); // base tilt in latitude (axis tilt feel)
  }, [center]);

  // Apply rotation (equator spin) each render
  projection.rotate([rotation, -18]);

  const pathGen = geoPath(projection);

  // Colors tuned to “Google Earth dark vibe”
  const ocean = "#07111f";
  const landBase = "rgba(255,255,255,0.06)"; // faint land on dark globe
  const border = "rgba(170,190,220,0.18)";
  const glowGold = "#f5de88";

  return (
    <div className="mt-2">
      {/* Responsive display sizing */}
      <div className="relative w-[220px] h-[220px] sm:w-[260px] sm:h-[260px] md:w-[320px] md:h-[320px] mx-auto">
        <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full block">
          <defs>
            {/* Sphere shading */}
            <radialGradient id="oceanShade" cx="30%" cy="28%" r="75%">
              <stop offset="0%" stopColor="#0b1b33" stopOpacity="1" />
              <stop offset="55%" stopColor={ocean} stopOpacity="1" />
              <stop offset="100%" stopColor="#040810" stopOpacity="1" />
            </radialGradient>

            {/* Atmosphere rim */}
            <radialGradient id="atmo" cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#8fd3ff" stopOpacity="0.10" />
              <stop offset="60%" stopColor="#8fd3ff" stopOpacity="0.04" />
              <stop offset="100%" stopColor="#8fd3ff" stopOpacity="0" />
            </radialGradient>

            {/* Gold glow for visited countries */}
            <filter id="goldGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.2" result="blur" />
              <feColorMatrix
                in="blur"
                type="matrix"
                values="
                  1 0 0 0 0
                  0 1 0 0 0
                  0 0 1 0 0
                  0 0 0 0.9 0"
                result="colored"
              />
              <feMerge>
                <feMergeNode in="colored" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Soft shadow to deepen sphere */}
            <filter id="sphereShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#000" floodOpacity="0.25" />
            </filter>
          </defs>

          {/* Sphere */}
          <circle
            cx={center}
            cy={center}
            r={size * 0.42}
            fill="url(#oceanShade)"
            filter="url(#sphereShadow)"
          />

          {/* Atmosphere overlay */}
          <circle cx={center} cy={center} r={size * 0.42} fill="url(#atmo)" />

          {/* Countries */}
          {features.map((f, idx) => {
            const name = normalizeCountryName(f?.properties?.name || "");
            const isVisited = visitedSet.has(name);

            const d = pathGen(f) || "";
            if (!d) return null;

            return (
              <g key={idx}>
                {/* Glow layer for visited */}
                {isVisited ? (
                  <path
                    d={d}
                    fill={glowGold}
                    opacity={0.85}
                    filter="url(#goldGlow)"
                  />
                ) : null}

                {/* Base land layer */}
                <path
                  d={d}
                  fill={isVisited ? glowGold : landBase}
                  opacity={isVisited ? 0.92 : 1}
                  stroke={border}
                  strokeWidth={0.7}
                  vectorEffect="non-scaling-stroke"
                />
              </g>
            );
          })}

          {/* Dark limb vignette to sell curvature */}
          <circle
            cx={center}
            cy={center}
            r={size * 0.42}
            fill="transparent"
            stroke="rgba(0,0,0,0.35)"
            strokeWidth={size * 0.06}
            opacity={0.65}
          />
        </svg>
      </div>
    </div>
  );
}
