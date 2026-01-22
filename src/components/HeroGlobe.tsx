"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { geoOrthographic, geoPath, geoDistance, geoInterpolate } from "d3-geo";
import { feature } from "topojson-client";

type Props = {
  visitedCountries: string[];
  currentCountry?: string | null;
  routeCountries?: string[]; // ordered oldest->newest
};

function normalizeCountryName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\s+/g, " ");
}

const COUNTRY_ALIASES: Record<string, string> = {
  usa: "united states of america",
  "united states": "united states of america",

  uk: "united kingdom",
  "united kingdom": "united kingdom",
  england: "united kingdom",
  scotland: "united kingdom",
  wales: "united kingdom",

  czechia: "czech republic",
  "czech republic": "czech republic",

  russia: "russian federation",
  vietnam: "viet nam",
  iran: "iran (islamic republic of)",
  syria: "syrian arab republic",
  laos: "lao people's democratic republic",
  moldova: "moldova, republic of",
  brunei: "brunei darussalam",

  "hong kong": "china",
  hongkong: "china",

  uae: "united arab emirates",

  vatican: "italy",
  "vatican city": "italy",
  "san marino": "italy",
  sanmarino: "italy",

  "south korea": "korea, republic of",
  korea: "korea, republic of",
  "north korea": "korea, democratic people's democratic republic of",
};

/** Deterministic PRNG so lights/stars don't jump */
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

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

function getTouchDist(t1: Touch, t2: Touch) {
  const dx = t1.clientX - t2.clientX;
  const dy = t1.clientY - t2.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Quick centroid approximation for Polygon/MultiPolygon.
 * (Good enough for marker + route anchoring.)
 */
function centroidOfFeature(f: any): [number, number] | null {
  const geom = f?.geometry;
  if (!geom) return null;

  const coords: number[][] = [];
  const pushRing = (ring: any[]) => {
    for (const p of ring) coords.push(p);
  };

  if (geom.type === "Polygon") {
    for (const ring of geom.coordinates) pushRing(ring);
  } else if (geom.type === "MultiPolygon") {
    for (const poly of geom.coordinates) {
      for (const ring of poly) pushRing(ring);
    }
  } else {
    return null;
  }

  if (!coords.length) return null;

  let sx = 0;
  let sy = 0;
  for (const [lon, lat] of coords) {
    sx += lon;
    sy += lat;
  }
  return [sx / coords.length, sy / coords.length];
}

export function HeroGlobe({
  visitedCountries,
  currentCountry,
  routeCountries,
}: Props) {
  const [features, setFeatures] = useState<any[]>([]);
  const [rotation, setRotation] = useState(0);

  // --------- Zoom/pan (map-like) ----------
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const zoomRef = useRef(1);
  const panRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);
  useEffect(() => {
    panRef.current = pan;
  }, [pan]);

  const containerRef = useRef<HTMLDivElement | null>(null);

  // Pinch tracking
  const pinchDistRef = useRef<number | null>(null);

  // Drag-to-rotate tracking
  const draggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartRotRef = useRef(0);

  // Tuning
  const ZOOM_MIN = 1; // contained: allow zooming out to exactly 1 only
  const ZOOM_MAX = 2.6;
  const ZOOM_SPIN_PAUSE_AT = 1.02; // when zoom > this, pause auto-spin

  const size = 320;
  const center = size / 2;
  const baseRadius = size * 0.42; // fixed sphere radius (container-contained)
  const tilt = -18;

  // Load topojson
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

  // Auto spin (paused when zoomed in or dragging)
  useEffect(() => {
    const SPEED = 25; // deg/sec
    let raf = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;

      const shouldSpin =
        zoomRef.current <= ZOOM_SPIN_PAUSE_AT && !draggingRef.current;

      if (shouldSpin) {
        setRotation((r) => (r + SPEED * dt) % 360);
      }

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

  // Projection is centered; zoom affects projection scale only.
  const projection = useMemo(() => {
    return geoOrthographic()
      .scale(baseRadius * zoom)
      .translate([center, center])
      .clipAngle(90);
  }, [baseRadius, zoom, center]);

  // apply rotation for this render
  projection.rotate([rotation, tilt]);

  const pathGen = geoPath(projection);

  // Palette
  const oceanA = "#050b15";
  const oceanB = "#0b1a33";
  const landBase = "rgba(255,255,255,0.04)";
  const border = "rgba(170, 195, 230, 0.14)";
  const glowGold = "#f5de88";

  const routeColor = "80, 200, 255";
  const visitedBorder = "#945f10";

  const viewCenterLonLat = useMemo<[number, number]>(
    () => [-rotation, -tilt],
    [rotation]
  );

  // Starfield
  const stars = useMemo(() => {
    const rand = mulberry32(hashString("stars"));
    const pts: { x: number; y: number; r: number; o: number }[] = [];
    const n = 120;

    for (let i = 0; i < n; i++) {
      const x = rand() * size;
      const y = rand() * size;
      const r = 0.5 + rand() * 1.4;
      const o = 0.03 + rand() * 0.12;
      pts.push({ x, y, r, o });
    }
    return pts;
  }, [size]);

  // City lights per visited country
  const lightsByCountry = useMemo(() => {
    const out: Record<
      string,
      { x: number; y: number; r: number; o: number }[]
    > = {};

    for (const f of features) {
      const name = normalizeCountryName(f?.properties?.name || "");
      if (!visitedSet.has(name)) continue;

      const rand = mulberry32(hashString(name));
      const pts: { x: number; y: number; r: number; o: number }[] = [];
      const n = 46;

      // generate in a box around the sphere; clipping will keep it inside
      for (let i = 0; i < n; i++) {
        const x = center - baseRadius + rand() * (baseRadius * 2);
        const y = center - baseRadius + rand() * (baseRadius * 2);
        const rr = 0.6 + rand() * 1.3;
        const o = 0.08 + rand() * 0.22;
        pts.push({ x, y, r: rr, o });
      }
      out[name] = pts;
    }

    return out;
  }, [features, visitedSet, center, baseRadius]);

  // Current country normalized
  const currentName = useMemo(() => {
    if (!currentCountry) return null;
    const n = normalizeCountryName(currentCountry);
    return COUNTRY_ALIASES[n] ?? n;
  }, [currentCountry]);

  const currentPoint = useMemo(() => {
    if (!currentName || !features.length) return null;

    const match = features.find((f) => {
      const name = normalizeCountryName(f?.properties?.name || "");
      return name === currentName;
    });
    if (!match) return null;

    const lonLat = centroidOfFeature(match);
    if (!lonLat) return null;

    const ang = geoDistance(lonLat, viewCenterLonLat);
    if (ang > Math.PI / 2) return null;

    const p = projection(lonLat);
    if (!p) return null;

    return { x: p[0], y: p[1] };
  }, [currentName, features, projection, viewCenterLonLat]);

  // Route lon/lat points
  const routeLonLat = useMemo(() => {
    if (!routeCountries?.length || !features.length) return [];

    const out: [number, number][] = [];

    for (const c of routeCountries) {
      const n0 = normalizeCountryName(c);
      const n = COUNTRY_ALIASES[n0] ?? n0;

      const match = features.find((f) => {
        const name = normalizeCountryName(f?.properties?.name || "");
        return name === n;
      });

      if (!match) continue;

      const lonLat = centroidOfFeature(match);
      if (!lonLat) continue;

      out.push(lonLat);
    }

    return out;
  }, [routeCountries, features]);

  const routeSegments = useMemo(() => {
    if (routeLonLat.length < 2) return [];

    const steps = 42;
    const segs: { d: string; t: number }[] = [];
    const total = routeLonLat.length - 1;

    for (let i = 0; i < total; i++) {
      const a = routeLonLat[i];
      const b = routeLonLat[i + 1];
      const t = total <= 1 ? 1 : i / (total - 1);

      const interp = geoInterpolate(a as any, b as any);
      const pts: Array<[number, number]> = [];

      for (let s = 0; s <= steps; s++) {
        const ll = interp(s / steps) as [number, number];

        const ang = geoDistance(ll, viewCenterLonLat);
        if (ang > Math.PI / 2) continue;

        const p = projection(ll as any) as [number, number] | null;
        if (p) pts.push(p);
      }

      if (pts.length < 2) continue;

      const d =
        "M " + pts.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join(" L ");

      segs.push({ d, t });
    }

    return segs;
  }, [routeLonLat, projection, viewCenterLonLat]);

  const routeNodes = useMemo(() => {
    if (!routeLonLat.length) return [];

    const nodes: { x: number; y: number; t: number }[] = [];
    const total = Math.max(routeLonLat.length - 1, 1);

    for (let i = 0; i < routeLonLat.length; i++) {
      const ll = routeLonLat[i];
      const t = routeLonLat.length <= 1 ? 1 : i / total;

      const ang = geoDistance(ll, viewCenterLonLat);
      if (ang > Math.PI / 2) continue;

      const p = projection(ll as any);
      if (!p) continue;

      nodes.push({ x: p[0], y: p[1], t });
    }

    return nodes;
  }, [routeLonLat, projection, viewCenterLonLat]);

  // ---- Zoom anchored to cursor / pinch midpoint ----
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const svgPointFromClient = (clientX: number, clientY: number) => {
      const rect = el.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * size;
      const y = ((clientY - rect.top) / rect.height) * size;
      return { x, y };
    };

    const applyAnchoredZoom = (newZoom: number, anchor: { x: number; y: number }) => {
      const z0 = zoomRef.current;
      const p0 = panRef.current;

      const z1 = clamp(newZoom, ZOOM_MIN, ZOOM_MAX);

      // If basically back to default, snap back neatly
      if (z1 <= 1.01) {
        setZoom(1);
        setPan({ x: 0, y: 0 });
        return;
      }

      // Effective point in the "unpanned" globe space
      const unpanned = { x: anchor.x - p0.x, y: anchor.y - p0.y };

      // Which lon/lat is currently under the anchor? (only works on visible hemisphere)
      const ll = projection.invert?.([unpanned.x, unpanned.y]);
      if (!ll) {
        setZoom(z1);
        return;
      }

      // Build a temporary projection at the NEW zoom to reproject that lon/lat
      const proj1 = geoOrthographic()
        .scale(baseRadius * z1)
        .translate([center, center])
        .clipAngle(90)
        .rotate([rotation, tilt]);

      const p1 = proj1(ll as any);
      if (!p1) {
        setZoom(z1);
        return;
      }

      // Set pan so that p1 + pan1 = anchor  => pan1 = anchor - p1
      const pan1 = { x: anchor.x - p1[0], y: anchor.y - p1[1] };

      setZoom(z1);
      setPan(pan1);
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();

      const anchor = svgPointFromClient(e.clientX, e.clientY);

      // stable feel across mouse wheels + trackpads
      const delta = -e.deltaY * 0.0012;
      const next = zoomRef.current + delta;

      applyAnchoredZoom(next, anchor);
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        pinchDistRef.current = getTouchDist(e.touches[0], e.touches[1]);
      }
      if (e.touches.length === 1 && zoomRef.current > ZOOM_SPIN_PAUSE_AT) {
        // begin drag rotate (mobile)
        draggingRef.current = true;
        dragStartXRef.current = e.touches[0].clientX;
        dragStartRotRef.current = rotation;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      // pinch zoom
      if (e.touches.length === 2 && pinchDistRef.current != null) {
        e.preventDefault();

        const d = getTouchDist(e.touches[0], e.touches[1]);
        const dd = d - pinchDistRef.current;
        pinchDistRef.current = d;

        const midClientX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const midClientY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        const anchor = svgPointFromClient(midClientX, midClientY);

        const next = zoomRef.current + dd * 0.003;
        applyAnchoredZoom(next, anchor);
        return;
      }

      // drag rotate (single finger) only while zoomed in
      if (e.touches.length === 1 && draggingRef.current && zoomRef.current > ZOOM_SPIN_PAUSE_AT) {
        e.preventDefault();
        const dx = e.touches[0].clientX - dragStartXRef.current;
        const ROT_SENS = 0.22; // deg per px
        setRotation((dragStartRotRef.current + dx * ROT_SENS) % 360);
      }
    };

    const onTouchEnd = () => {
      pinchDistRef.current = null;
      draggingRef.current = false;
    };

    // Pointer (mouse) drag rotate when zoomed in
    const onPointerDown = (e: PointerEvent) => {
      if (zoomRef.current <= ZOOM_SPIN_PAUSE_AT) return;
      draggingRef.current = true;
      dragStartXRef.current = e.clientX;
      dragStartRotRef.current = rotation;

      // capture to keep dragging even if pointer leaves element
      (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!draggingRef.current) return;
      if (zoomRef.current <= ZOOM_SPIN_PAUSE_AT) return;

      e.preventDefault();

      const dx = e.clientX - dragStartXRef.current;
      const ROT_SENS = 0.22; // deg per px
      setRotation((dragStartRotRef.current + dx * ROT_SENS) % 360);
    };

    const onPointerUp = () => {
      draggingRef.current = false;
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("touchstart", onTouchStart, { passive: false });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: false });
    el.addEventListener("touchcancel", onTouchEnd, { passive: false });

    el.addEventListener("pointerdown", onPointerDown, { passive: false });
    el.addEventListener("pointermove", onPointerMove, { passive: false });
    el.addEventListener("pointerup", onPointerUp, { passive: false });
    el.addEventListener("pointercancel", onPointerUp, { passive: false });
    el.addEventListener("pointerleave", onPointerUp, { passive: false });

    return () => {
      el.removeEventListener("wheel", onWheel as any);
      el.removeEventListener("touchstart", onTouchStart as any);
      el.removeEventListener("touchmove", onTouchMove as any);
      el.removeEventListener("touchend", onTouchEnd as any);
      el.removeEventListener("touchcancel", onTouchEnd as any);

      el.removeEventListener("pointerdown", onPointerDown as any);
      el.removeEventListener("pointermove", onPointerMove as any);
      el.removeEventListener("pointerup", onPointerUp as any);
      el.removeEventListener("pointercancel", onPointerUp as any);
      el.removeEventListener("pointerleave", onPointerUp as any);
    };
  }, [projection, baseRadius, center, rotation, tilt]);

  // Cursor feedback: only “grab” when zoomed in
  const cursorClass =
    zoom > ZOOM_SPIN_PAUSE_AT ? "cursor-grab active:cursor-grabbing" : "cursor-default";

  return (
    <div className="mt-0">
      <div
        ref={containerRef}
        className={[
          "relative w-[220px] h-[220px] sm:w-[260px] sm:h-[260px] md:w-[320px] md:h-[320px] mx-auto select-none",
          cursorClass,
        ].join(" ")}
        style={{
          touchAction: "none",
        }}
        aria-label="Interactive globe. Scroll/pinch to zoom, drag to rotate when zoomed in."
        title="Scroll/pinch to zoom • Drag to rotate (when zoomed in)"
      >
        <svg
  viewBox={`0 0 ${size} ${size}`}
  className="h-full w-full block"
  style={{ overflow: "hidden" }}
>
  <defs>
    {/* Ocean shading */}
    <radialGradient id="oceanShade" cx="28%" cy="26%" r="78%">
      <stop offset="0%" stopColor={oceanB} stopOpacity="1" />
      <stop offset="58%" stopColor={oceanA} stopOpacity="1" />
      <stop offset="100%" stopColor="#02040a" stopOpacity="1" />
    </radialGradient>

    {/* Terminator shading */}
    <radialGradient id="terminator" cx="36%" cy="40%" r="80%">
      <stop offset="0%" stopColor="rgba(0,0,0,0)" />
      <stop offset="55%" stopColor="rgba(0,0,0,0.10)" />
      <stop offset="100%" stopColor="rgba(0,0,0,0.52)" />
    </radialGradient>

    {/* Atmosphere glow */}
    <radialGradient id="atmo" cx="35%" cy="30%" r="75%">
      <stop offset="0%" stopColor="rgba(143,211,255,0.08)" />
      <stop offset="60%" stopColor="rgba(143,211,255,0.03)" />
      <stop offset="100%" stopColor="rgba(143,211,255,0)" />
    </radialGradient>

    {/* Specular highlight */}
    <radialGradient id="spec" cx="30%" cy="28%" r="55%">
      <stop offset="0%" stopColor="rgba(255,255,255,0.14)" />
      <stop offset="40%" stopColor="rgba(255,255,255,0.05)" />
      <stop offset="70%" stopColor="rgba(255,255,255,0)" />
    </radialGradient>

    {/* ✅ Clip to the fixed visible sphere */}
    <clipPath id="sphereClip">
      <circle cx={center} cy={center} r={baseRadius} />
    </clipPath>

    {/* Gold glow (visited countries) */}
    <filter id="goldGlow" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="2.6" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>

    {/* Dark gold outline glow (visited borders) */}
    <filter id="goldBorderGlow" x="-70%" y="-70%" width="240%" height="240%">
      <feGaussianBlur stdDeviation="1.25" result="b" />
      <feMerge>
        <feMergeNode in="b" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>

    {/* Light glow for speckles */}
    <filter id="lightGlow" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="1.9" result="b" />
      <feMerge>
        <feMergeNode in="b" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>

    {/* Pin glow */}
    <filter id="pinGlow" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="2.2" result="b" />
      <feMerge>
        <feMergeNode in="b" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>

    {/* Route glow */}
    <filter id="routeGlow" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="1.4" result="b" />
      <feMerge>
        <feMergeNode in="b" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>

    {/* Node glow (neon) */}
    <filter id="nodeGlow" x="-120%" y="-120%" width="340%" height="340%">
      <feGaussianBlur stdDeviation="1.3" result="b" />
      <feMerge>
        <feMergeNode in="b" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>

    {/* Soft outer shadow */}
    <filter id="sphereShadow" x="-25%" y="-25%" width="150%" height="150%">
      <feDropShadow
        dx="0"
        dy="6"
        stdDeviation="8"
        floodColor="#000"
        floodOpacity="0.10"
      />
    </filter>
  </defs>

  {/* STARFIELD (stays fixed behind) */}
  <g opacity={0.75}>
    {stars.map((s, i) => (
      <circle
        key={i}
        cx={s.x}
        cy={s.y}
        r={s.r}
        fill="#ffffff"
        opacity={s.o}
      />
    ))}
  </g>

  {/* Shadow OUTSIDE the clip so it looks natural */}
  <circle
    cx={center}
    cy={center}
    r={baseRadius}
    fill="transparent"
    filter="url(#sphereShadow)"
  />

  {/* ✅ Everything that could ever “spill” is inside the clip */}
  <g clipPath="url(#sphereClip)">
    {/* Ocean fill */}
    <circle cx={center} cy={center} r={baseRadius} fill="url(#oceanShade)" />

    {/* Atmo/spec */}
    <circle cx={center} cy={center} r={baseRadius} fill="url(#atmo)" />
    <circle cx={center} cy={center} r={baseRadius} fill="url(#spec)" />

    {/* ✅ Pan the map layer ONLY (zoom already applied via projection.scale) */}
    <g transform={`translate(${pan.x} ${pan.y})`}>
      {/* ROUTE */}
      {routeSegments.length ? (
        <g filter="url(#routeGlow)">
          {routeSegments.map(({ d }, i) => (
            <path
              key={`route-${i}`}
              d={d}
              fill="none"
              stroke={`rgba(${routeColor},0)`}
              strokeWidth={0}
              strokeLinecap="round"
            />
          ))}

          {routeSegments.map(({ d, t }, i) => {
            if (t <= 0.35) return null;
            const pulseAlpha = 0.04 + 0.06 * t;
            return (
              <path
                key={`pulse-${i}`}
                d={d}
                fill="none"
                stroke={`rgba(${routeColor},${pulseAlpha})`}
                strokeWidth={1.25}
                strokeLinecap="round"
                className={`travel-pulse travel-pulse-${i}`}
              />
            );
          })}
        </g>
      ) : null}

      {/* Nodes */}
      {routeNodes.length ? (
        <g filter="url(#nodeGlow)">
          {routeNodes.map((n, i) => {
            const r = 1.3 + 0.3 * n.t;
            const a = 0.42 + 0.08 * n.t;

            return (
              <g key={`node-${i}`}>
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={r * 2.2}
                  fill={`rgba(${routeColor},${0.10 + 0.05 * n.t})`}
                />
                <circle cx={n.x} cy={n.y} r={r} fill={`rgba(${routeColor},${a})`} />
                <circle
                  cx={n.x - 0.6}
                  cy={n.y - 0.6}
                  r={Math.max(0.55, r * 0.38)}
                  fill="rgba(255,255,255,0.55)"
                  opacity={0.55}
                />
              </g>
            );
          })}
        </g>
      ) : null}

      {/* Countries */}
      {features.map((f, idx) => {
        const name = normalizeCountryName(f?.properties?.name || "");
        const isVisited = visitedSet.has(name);
        const d = pathGen(f) || "";
        if (!d) return null;

        const clipId = `clip-${idx}`;

        return (
          <g key={idx}>
            {isVisited ? (
              <defs>
                <clipPath id={clipId}>
                  <path d={d} />
                </clipPath>
              </defs>
            ) : null}

            {isVisited ? (
              <path
                d={d}
                fill={glowGold}
                opacity={0.55}
                className="visited-pulse"
                filter="url(#goldGlow)"
              />
            ) : null}

            <path
              d={d}
              fill={isVisited ? glowGold : landBase}
              opacity={isVisited ? 0.82 : 1}
              stroke={isVisited ? visitedBorder : border}
              strokeWidth={isVisited ? 1.05 : 0.7}
              filter={isVisited ? "url(#goldBorderGlow)" : undefined}
              className={isVisited ? "visited-border-pulse" : undefined}
              vectorEffect="non-scaling-stroke"
            />

            {isVisited && lightsByCountry[name]?.length ? (
              <g
                clipPath={`url(#${clipId})`}
                filter="url(#lightGlow)"
                className="visited-pulse"
              >
                {lightsByCountry[name].map((p, i) => (
                  <circle
                    key={i}
                    cx={p.x}
                    cy={p.y}
                    r={p.r}
                    fill="#ffc83d"
                    opacity={p.o}
                  />
                ))}
              </g>
            ) : null}
          </g>
        );
      })}

      {/* Current pin */}
      {currentPoint ? (
        <g
          className="current-pin"
          transform={`translate(${currentPoint.x}, ${currentPoint.y})`}
        >
          <circle
            r="6.25"
            fill="transparent"
            stroke="rgba(255, 70, 70, 0.78)"
            strokeWidth="1.9"
            filter="url(#pinGlow)"
            className="pin-ring"
          />
          <circle r="2.625" fill="#ff3b3b" filter="url(#pinGlow)" />
          <circle cx="-0.75" cy="-0.75" r="0.75" fill="rgba(255,255,255,0.78)" />
        </g>
      ) : null}
    </g>

    {/* Terminator on top, clipped */}
    <circle cx={center} cy={center} r={baseRadius} fill="url(#terminator)" />
  </g>
</svg>


        <style jsx>{`
          .visited-pulse {
            animation: pulseGlow 4.6s ease-in-out infinite;
            transform-origin: 50% 50%;
          }

          .visited-border-pulse {
            animation: borderPulse 4.6s ease-in-out infinite;
          }

          @keyframes pulseGlow {
            0% { opacity: 0.55; }
            50% { opacity: 0.88; }
            100% { opacity: 0.55; }
          }

          @keyframes borderPulse {
            0% { stroke-opacity: 0.55; }
            50% { stroke-opacity: 0.92; }
            100% { stroke-opacity: 0.55; }
          }

          .current-pin {
            animation: pinFade 1.6s ease-in-out infinite;
            transform-origin: 0 0;
          }

          @keyframes pinFade {
            0% { opacity: 0.85; }
            50% { opacity: 1; }
            100% { opacity: 0.85; }
          }

          .pin-ring {
            animation: ringExpand 1.6s ease-out infinite;
            transform-origin: 0 0;
          }

          @keyframes ringExpand {
            0% { transform: scale(0.55); opacity: 0.75; }
            70% { transform: scale(1.45); opacity: 0; }
            100% { transform: scale(1.45); opacity: 0; }
          }

          .travel-pulse {
            stroke-dasharray: 6 18;
            animation: dashMove 3s linear infinite;
          }

          @keyframes dashMove {
            to { stroke-dashoffset: -140; }
          }

          ${Array.from({ length: 24 })
            .map((_, i) => `.travel-pulse-${i} { animation-delay: -${i * 0.18}s; }`)
            .join("\n")}

          @media (prefers-reduced-motion: reduce) {
            .visited-pulse,
            .visited-border-pulse,
            .current-pin,
            .pin-ring,
            .travel-pulse {
              animation: none;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
