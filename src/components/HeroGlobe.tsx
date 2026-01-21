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

/**
 * Deterministic PRNG so lights don't "jump" each rerender
 * (based on a simple hash -> mulberry32)
 */
function hashString(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function HeroGlobe({ visitedCountries }: Props) {
  const [features, setFeatures] = useState<any[]>([]);
  const [rotation, setRotation] = useState(0);

  // Internal draw size (scaled by CSS wrapper)
  const size = 320;
  const center = size / 2;
  const radius = size * 0.42;

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
      setRotation((r) => (r + 0.16) % 360); // slightly slower & smoother
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
    return geoOrthographic()
      .scale(radius)
      .translate([center, center])
      .rotate([0, -18]); // latitude tilt
  }, [center, radius]);

  // equator spin
  projection.rotate([rotation, -18]);

  const pathGen = geoPath(projection);

  // Tuned colors
  const oceanA = "#050b15";
  const oceanB = "#0b1a33";
  const landBase = "rgba(255,255,255,0.04)";
  const border = "rgba(170, 195, 230, 0.14)";
  const glowGold = "#f5de88";

  // Create a small set of "city lights" per visited country, deterministic
  const lightsByCountry = useMemo(() => {
    const out: Record<string, { x: number; y: number; r: number; o: number }[]> = {};
    for (const f of features) {
      const name = normalizeCountryName(f?.properties?.name || "");
      if (!visitedSet.has(name)) continue;

      const rand = mulberry32(hashString(name));
      const pts: { x: number; y: number; r: number; o: number }[] = [];

      // fewer lights = cleaner/minimal. increase if you want more “city” feel.
      const n = 46;

      for (let i = 0; i < n; i++) {
        // place within a generous bounding box; clipPath ensures they only appear on the country
        const x = center - radius + rand() * (radius * 2);
        const y = center - radius + rand() * (radius * 2);

        // tiny radii + varied opacity
        const r = 0.6 + rand() * 1.3;
        const o = 0.08 + rand() * 0.22;

        pts.push({ x, y, r, o });
      }

      out[name] = pts;
    }
    return out;
  }, [features, visitedSet, center, radius]);

  return (
    <div className="mt-2">
      <div className="relative w-[220px] h-[220px] sm:w-[260px] sm:h-[260px] md:w-[320px] md:h-[320px] mx-auto">
        <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full block">
          <defs>
            {/* Ocean shading */}
            <radialGradient id="oceanShade" cx="28%" cy="26%" r="78%">
              <stop offset="0%" stopColor={oceanB} stopOpacity="1" />
              <stop offset="58%" stopColor={oceanA} stopOpacity="1" />
              <stop offset="100%" stopColor="#02040a" stopOpacity="1" />
            </radialGradient>

            {/* Terminator shading to sell the sphere */}
            <radialGradient id="terminator" cx="36%" cy="40%" r="80%">
              <stop offset="0%" stopColor="rgba(0,0,0,0)" />
              <stop offset="55%" stopColor="rgba(0,0,0,0.10)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0.52)" />
            </radialGradient>

            {/* Atmosphere glow */}
            <radialGradient id="atmo" cx="35%" cy="30%" r="75%">
              <stop offset="0%" stopColor="rgba(143,211,255,0.10)" />
              <stop offset="60%" stopColor="rgba(143,211,255,0.05)" />
              <stop offset="100%" stopColor="rgba(143,211,255,0)" />
            </radialGradient>

            {/* Specular highlight */}
            <radialGradient id="spec" cx="30%" cy="28%" r="55%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.14)" />
              <stop offset="40%" stopColor="rgba(255,255,255,0.05)" />
              <stop offset="70%" stopColor="rgba(255,255,255,0)" />
            </radialGradient>

            {/* Gold glow */}
            <filter id="goldGlow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="2.4" result="blur" />
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

            {/* Softer light glow for “city lights” */}
            <filter id="lightGlow" x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="1.7" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Subtle outer shadow */}
            <filter id="sphereShadow" x="-25%" y="-25%" width="150%" height="150%">
              <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#000" floodOpacity="0.28" />
            </filter>
          </defs>

          {/* Sphere base */}
          <circle cx={center} cy={center} r={radius} fill="url(#oceanShade)" filter="url(#sphereShadow)" />

          {/* Atmosphere fill */}
          <circle cx={center} cy={center} r={radius} fill="url(#atmo)" />

          {/* Specular highlight */}
          <circle cx={center} cy={center} r={radius} fill="url(#spec)" />

          {/* Countries */}
          {features.map((f, idx) => {
            const name = normalizeCountryName(f?.properties?.name || "");
            const isVisited = visitedSet.has(name);
            const d = pathGen(f) || "";
            if (!d) return null;

            const clipId = `clip-${idx}`;

            return (
              <g key={idx}>
                {/* clip to country shape so lights don't spill outside */}
                {isVisited ? (
                  <defs>
                    <clipPath id={clipId}>
                      <path d={d} />
                    </clipPath>
                  </defs>
                ) : null}

                {/* Glowing visited land */}
                {isVisited ? (
                  <path d={d} fill={glowGold} opacity={0.78} filter="url(#goldGlow)" />
                ) : null}

                {/* Base land + borders */}
                <path
                  d={d}
                  fill={isVisited ? glowGold : landBase}
                  opacity={isVisited ? 0.88 : 1}
                  stroke={border}
                  strokeWidth={0.7}
                  vectorEffect="non-scaling-stroke"
                />

                {/* City-light speckles for visited countries */}
                {isVisited && lightsByCountry[name]?.length ? (
                  <g clipPath={`url(#${clipId})`} filter="url(#lightGlow)">
                    {lightsByCountry[name].map((p, i) => (
                      <circle
                        key={i}
                        cx={p.x}
                        cy={p.y}
                        r={p.r}
                        fill={glowGold}
                        opacity={p.o}
                      />
                    ))}
                  </g>
                ) : null}
              </g>
            );
          })}

          {/* Terminator shading (dark side) */}
          <circle cx={center} cy={center} r={radius} fill="url(#terminator)" />

          {/* Atmosphere rim (stroke) */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="rgba(120, 200, 255, 0.22)"
            strokeWidth={2.2}
            opacity={0.35}
          />

          {/* Soft vignette at limb */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="rgba(0,0,0,0.42)"
            strokeWidth={size * 0.055}
            opacity={0.72}
          />
        </svg>
      </div>
    </div>
  );
}
