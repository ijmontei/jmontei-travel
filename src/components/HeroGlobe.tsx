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

export function HeroGlobe({ visitedCountries, currentCountry, routeCountries }: Props) {
  const [features, setFeatures] = useState<any[]>([]);

  // --- Rotation (user can drag anytime) ---
  const DEFAULT_TILT = -18; // degrees
  const [rotLon, setRotLon] = useState(0); // left/right
  const [rotLat, setRotLat] = useState(DEFAULT_TILT); // up/down (tilt)

  const rotLonRef = useRef(0);
  const rotLatRef = useRef(DEFAULT_TILT);
  useEffect(() => void (rotLonRef.current = rotLon), [rotLon]);
  useEffect(() => void (rotLatRef.current = rotLat), [rotLat]);

  // --------- Zoom/pan (map-like) ----------
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const zoomRef = useRef(1);
  const panRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => void (zoomRef.current = zoom), [zoom]);
  useEffect(() => void (panRef.current = pan), [pan]);

  const containerRef = useRef<HTMLDivElement | null>(null);

  // Pinch tracking
  const pinchDistRef = useRef<number | null>(null);

  // Drag-to-rotate tracking
  const draggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartYRef = useRef(0);
  const dragStartLonRef = useRef(0);
  const dragStartLatRef = useRef(DEFAULT_TILT);

  // Tuning
  const ZOOM_MIN = 1;
  const ZOOM_MAX = 4;

  const size = 320;
  const center = size / 2;
  const baseRadius = size * 0.42;

  /**
   * HALO SETTINGS (tight, realistic)
   * - Halo is only slightly larger than the globe
   * - Gradient goes near-black at the outer edge of the halo
   */
  // Inner "void" radius (fully opaque space pocket)
  const voidR = baseRadius * 1.25;

  // Total halo radius (void + feather). 2x makes the visible halo feel doubled.
  const haloR = voidR * 1.1;

  // Where the feather begins (as a % of the gradient)
  const voidPct = (voidR / haloR) * 100; // ~50%

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

  // Auto spin with smooth ramp back after user interaction + tilt returns to default
  useEffect(() => {
    const SPEED = 25; // deg/sec
    const RAMP = 10; // higher = snappier ramp back
    const ZOOM_STOP_AT = 1.02; // stop auto-spin when zoomed in past this

    let raf = 0;
    let last = performance.now();
    let spinSpeed = SPEED;

    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;

      const zoomedIn = zoomRef.current > ZOOM_STOP_AT;
      const interacting = draggingRef.current;

      // If zoomed in OR dragging, pause auto-spin
      const target = zoomedIn || interacting ? 0 : SPEED;

      // smooth ramp to target speed
      spinSpeed += (target - spinSpeed) * (1 - Math.exp(-RAMP * dt));

      if (Math.abs(spinSpeed) > 0.001) {
        setRotLon((r) => (r + spinSpeed * dt) % 360);
      }

      // Only “return tilt to default” when user isn't actively dragging
      if (!interacting) {
        const k = 6;
        setRotLat((lat) => lat + (DEFAULT_TILT - lat) * (1 - Math.exp(-k * dt)));
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
    return geoOrthographic().scale(baseRadius * zoom).translate([center, center]).clipAngle(90);
  }, [baseRadius, zoom, center]);

  // apply rotation for this render
  projection.rotate([rotLon, rotLat]);

  const pathGen = geoPath(projection);

  // Palette
  const oceanA = "#050b15";
  const oceanB = "#0b1a33";
  const landBase = "rgba(255,255,255,0.04)";
  const border = "rgba(170, 195, 230, 0.14)";
  const glowGold = "#f5de88";

  const routeColor = "80, 200, 255";
  const visitedBorder = "#945f10";

  const viewCenterLonLat = useMemo<[number, number]>(() => [-rotLon, -rotLat], [rotLon, rotLat]);

  /**
   * Background motion:
   * - Halo gradient stays FIXED.
   * - Stars + nebula drift based on rotLon/rotLat (parallax), clipped to a circle.
   */
  const starField = useMemo(() => {
    const rand = mulberry32(hashString("bg-stars-v2"));
    const field = size * 2.1; // smaller field now that halo is smaller
    const pts: { x: number; y: number; r: number; o: number; tw: number }[] = [];
    const n = 190; // fewer stars = cleaner/tighter

    for (let i = 0; i < n; i++) {
      const x = rand() * field - field / 2;
      const y = rand() * field - field / 2;
      const r = 0.5 + rand() * 1.5;
      const o = 0.03 + rand() * 0.16;
      const tw = rand();
      pts.push({ x, y, r, o, tw });
    }
    return { field, pts };
  }, [size]);

  const nebula = useMemo(() => {
    const rand = mulberry32(hashString("bg-nebula-v2"));
    const blobs: { x: number; y: number; r: number; o: number; hue: "blue" | "violet" | "cyan" }[] = [];
    const field = size * 1.9;
    const n = 7;

    const hues: Array<"blue" | "violet" | "cyan"> = ["blue", "violet", "cyan"];

    for (let i = 0; i < n; i++) {
      const x = rand() * field - field / 2;
      const y = rand() * field - field / 2;
      const r = size * (0.18 + rand() * 0.32);
      const o = 0.05 + rand() * 0.10;
      const hue = hues[Math.floor(rand() * hues.length)];
      blobs.push({ x, y, r, o, hue });
    }
    return { field, blobs };
  }, [size]);

  const bgShift = useMemo(() => {
    const starPxPerDegX = 1.05;
    const starPxPerDegY = 0.55;

    const sx = rotLon * starPxPerDegX;
    const sy = -rotLat * starPxPerDegY;

    const nx = rotLon * starPxPerDegX * 0.32;
    const ny = -rotLat * starPxPerDegY * 0.32;

    return { sx, sy, nx, ny };
  }, [rotLon, rotLat]);

  const wrap = (v: number, range: number) => {
    const half = range / 2;
    let x = v;
    x = ((x + half) % range + range) % range;
    return x - half;
  };

  // City lights per visited country
  const lightsByCountry = useMemo(() => {
    const out: Record<string, { x: number; y: number; r: number; o: number }[]> = {};

    for (const f of features) {
      const name = normalizeCountryName(f?.properties?.name || "");
      if (!visitedSet.has(name)) continue;

      const rand = mulberry32(hashString(name));
      const pts: { x: number; y: number; r: number; o: number }[] = [];
      const n = 46;

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

      const d = "M " + pts.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join(" L ");
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
      const z1 = clamp(newZoom, ZOOM_MIN, ZOOM_MAX);
      const p0 = panRef.current;

      if (z1 <= 1.01) {
        setZoom(1);
        setPan({ x: 0, y: 0 });
        return;
      }

      const unpanned = { x: anchor.x - p0.x, y: anchor.y - p0.y };

      const invertFn = (projection as any).invert as ((p: [number, number]) => [number, number] | null) | undefined;
      const ll = invertFn?.([unpanned.x, unpanned.y]);
      if (!ll) {
        setZoom(z1);
        return;
      }

      const proj1 = geoOrthographic()
        .scale(baseRadius * z1)
        .translate([center, center])
        .clipAngle(90)
        .rotate([rotLonRef.current, rotLatRef.current]);

      const p1 = proj1(ll as any);
      if (!p1) {
        setZoom(z1);
        return;
      }

      const pan1 = { x: anchor.x - p1[0], y: anchor.y - p1[1] };

      setZoom(z1);
      setPan(pan1);
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const anchor = svgPointFromClient(e.clientX, e.clientY);
      const delta = -e.deltaY * 0.0012;
      applyAnchoredZoom(zoomRef.current + delta, anchor);
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        pinchDistRef.current = getTouchDist(e.touches[0], e.touches[1]);
        draggingRef.current = false;
        return;
      }

      if (e.touches.length === 1) {
        draggingRef.current = true;
        dragStartXRef.current = e.touches[0].clientX;
        dragStartYRef.current = e.touches[0].clientY;
        dragStartLonRef.current = rotLonRef.current;
        dragStartLatRef.current = rotLatRef.current;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && pinchDistRef.current != null) {
        e.preventDefault();

        const d = getTouchDist(e.touches[0], e.touches[1]);
        const dd = d - pinchDistRef.current;
        pinchDistRef.current = d;

        const midClientX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const midClientY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        const anchor = svgPointFromClient(midClientX, midClientY);

        applyAnchoredZoom(zoomRef.current + dd * 0.003, anchor);
        return;
      }

      if (e.touches.length === 1 && draggingRef.current) {
        e.preventDefault();

        const dx = e.touches[0].clientX - dragStartXRef.current;
        const dy = e.touches[0].clientY - dragStartYRef.current;

        const LON_SENS = 0.22;
        const LAT_SENS = 0.18;

        setRotLon((dragStartLonRef.current + dx * LON_SENS) % 360);
        setRotLat(clamp(dragStartLatRef.current - dy * LAT_SENS, -70, 70));
      }
    };

    const onTouchEnd = () => {
      pinchDistRef.current = null;
      draggingRef.current = false;
    };

    const onPointerDown = (e: PointerEvent) => {
      draggingRef.current = true;
      dragStartXRef.current = e.clientX;
      dragStartYRef.current = e.clientY;
      dragStartLonRef.current = rotLonRef.current;
      dragStartLatRef.current = rotLatRef.current;

      (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!draggingRef.current) return;
      e.preventDefault();

      const dx = e.clientX - dragStartXRef.current;
      const dy = e.clientY - dragStartYRef.current;

      const LON_SENS = 0.22;
      const LAT_SENS = 0.18;

      setRotLon((dragStartLonRef.current + dx * LON_SENS) % 360);
      setRotLat(clamp(dragStartLatRef.current - dy * LAT_SENS, -70, 70));
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
  }, [baseRadius, center, projection, size]);

  const cursorClass = "cursor-grab active:cursor-grabbing";

  return (
    <div className="mt-0">
      <div
        ref={containerRef}
        className={[
          "relative overflow-visible mx-auto select-none",
          // Extra vertical buffer so the halo never touches adjacent elements
          "w-[240px] h-[300px] sm:w-[290px] sm:h-[350px] md:w-[380px] md:h-[440px]",
          cursorClass,
        ].join(" ")}
        style={{ touchAction: "none" }}
        aria-label="Interactive globe. Scroll/pinch to zoom, drag to rotate."
        title="Scroll/pinch to zoom • Drag to rotate"
      >
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="h-full w-full block overflow-visible"
          style={{
            overflow: "visible",
            // Push the globe down slightly so top UI never overlaps the halo
            marginTop: "34px",
          }}
        >
          <defs>
            {/* ===== Cosmic halo: fully dark "void" until voidR, then fades out ===== */}
            <radialGradient id="cosmicHalo" cx="50%" cy="50%" r="50%">
              {/* keep center clean-ish */}
              <stop offset="0%" stopColor="rgba(0,0,0,0)" />
              <stop offset={`${Math.max(12, voidPct - 32)}%`} stopColor="rgba(6,10,20,0.18)" />

              {/* build into the void */}
              <stop offset={`${Math.max(30, voidPct - 14)}%`} stopColor="rgba(2,4,10,0.62)" />
              <stop offset={`${voidPct}%`} stopColor="rgba(0,0,0,0.92)" />

              {/* then gently relax outward (mask will actually fade to 0) */}
              <stop offset="100%" stopColor="rgba(0,0,0,0.60)" />
            </radialGradient>

            {/* ===== Opacity feather: FULL opacity through the void zone, then fade to 0 ===== */}
            <radialGradient id="haloFeather" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="white" stopOpacity="1" />
              <stop offset={`${voidPct}%`} stopColor="white" stopOpacity="1" />
              <stop offset={`${Math.min(90, voidPct + 25)}%`} stopColor="white" stopOpacity="0.35" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </radialGradient>

            <mask id="haloMask">
              <circle cx={center} cy={center} r={haloR} fill="url(#haloFeather)" />
            </mask>

            <clipPath id="haloClip">
              <circle cx={center} cy={center} r={haloR} />
            </clipPath>


            {/* Slightly softer than before (helps halo feel “real” without blowing up size) */}
            <filter id="nebulaBlur" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="14" />
            </filter>

            <filter id="starGlow" x="-180%" y="-180%" width="460%" height="460%">
            {/* soft bloom */}
            <feGaussianBlur stdDeviation="1.6" result="blur" />
            {/* slightly boost bloom intensity */}
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>


            {/* ===== Globe shading ===== */}
            <radialGradient id="oceanShade" cx="28%" cy="26%" r="78%">
              <stop offset="0%" stopColor={oceanB} stopOpacity="1" />
              <stop offset="58%" stopColor={oceanA} stopOpacity="1" />
              <stop offset="100%" stopColor="#02040a" stopOpacity="1" />
            </radialGradient>

            <radialGradient id="terminator" cx="36%" cy="40%" r="80%">
              <stop offset="0%" stopColor="rgba(0,0,0,0)" />
              <stop offset="55%" stopColor="rgba(0,0,0,0.10)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0.52)" />
            </radialGradient>

            <radialGradient id="atmo" cx="35%" cy="30%" r="75%">
              <stop offset="0%" stopColor="rgba(110, 200, 255, 0.12)" />
              <stop offset="55%" stopColor="rgba(110, 200, 255, 0.045)" />
              <stop offset="100%" stopColor="rgba(110, 200, 255, 0)" />
            </radialGradient>

            <radialGradient id="spec" cx="30%" cy="28%" r="55%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.14)" />
              <stop offset="40%" stopColor="rgba(255,255,255,0.05)" />
              <stop offset="70%" stopColor="rgba(255,255,255,0)" />
            </radialGradient>

            <clipPath id="sphereClip">
              <circle cx={center} cy={center} r={baseRadius} />
            </clipPath>

            <filter id="goldGlow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="2.6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id="goldBorderGlow" x="-70%" y="-70%" width="240%" height="240%">
              <feGaussianBlur stdDeviation="1.25" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id="lightGlow" x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="1.9" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id="pinGlow" x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="2.2" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id="routeGlow" x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="1.4" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id="nodeGlow" x="-120%" y="-120%" width="340%" height="340%">
              <feGaussianBlur stdDeviation="1.3" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Planet shadow & aura */}
            <filter id="sphereShadow" x="-25%" y="-25%" width="150%" height="150%">
              <feDropShadow dx="0" dy="10" stdDeviation="10" floodColor="#000" floodOpacity="0.14" />
            </filter>

            <filter id="auraGlow" x="-90%" y="-90%" width="280%" height="280%">
              <feGaussianBlur stdDeviation="6" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* ===== Tight circular cosmic background ===== */}
          <g clipPath="url(#haloClip)" mask="url(#haloMask)">
            {/* Halo base: edge near-black, diffuses inward */}
            <circle cx={center} cy={center} r={haloR} fill="url(#cosmicHalo)" filter="url(#nebulaBlur)" opacity={0.98} />

            {/* Nebula (moves slowly with spin direction) */}
            <g
              filter="url(#nebulaBlur)"
              opacity={0.80}
              transform={`translate(${bgShift.nx.toFixed(2)} ${bgShift.ny.toFixed(2)})`}
            >
              {nebula.blobs.map((b, i) => {
                const x = center + wrap(b.x, nebula.field);
                const y = center + wrap(b.y, nebula.field);

                const fill =
                  b.hue === "blue"
                    ? "rgba(85, 155, 255, 1)"
                    : b.hue === "cyan"
                      ? "rgba(110, 220, 255, 1)"
                      : "rgba(140, 110, 255, 1)";

                return <circle key={i} cx={x} cy={y} r={b.r} fill={fill} opacity={b.o} />;
              })}
            </g>

            {/* Stars (move more with spin direction) */}
            <g
            filter="url(#starGlow)"
            opacity={0.98}
            transform={`translate(${bgShift.sx.toFixed(2)} ${bgShift.sy.toFixed(2)})`}
          >
            {starField.pts.map((s, i) => {
              const x = center + wrap(s.x, starField.field);
              const y = center + wrap(s.y, starField.field);

              const tw = 0.85 + 0.25 * Math.sin((s.tw * 1000 + rotLon) * 0.12);
              const coreO = clamp(s.o * tw, 0.01, 0.20);

              // soft halo opacity stays subtle to avoid “cartoon glow”
              const haloO = clamp(coreO * 0.28, 0.008, 0.06);

              return (
                <g key={i}>
                  {/* halo */}
                  <circle cx={x} cy={y} r={s.r * 2.8} fill="#ffffff" opacity={haloO} />
                  {/* core */}
                  <circle cx={x} cy={y} r={s.r} fill="#ffffff" opacity={coreO} />
                </g>
              );
            })}
          </g>

          </g>

          {/* ===== Globe shadow + aura outside the sphere clip ===== */}
          <circle cx={center} cy={center} r={baseRadius} fill="transparent" filter="url(#sphereShadow)" />

          {/* Blue aura ring */}
          <circle
            cx={center}
            cy={center}
            r={baseRadius + 6}
            fill="none"
            stroke="rgba(90, 170, 255, 0.20)"
            strokeWidth={2.5}
            filter="url(#auraGlow)"
          />
          <circle
            cx={center}
            cy={center}
            r={baseRadius + 10}
            fill="none"
            stroke="rgba(90, 170, 255, 0.10)"
            strokeWidth={6}
            filter="url(#auraGlow)"
            opacity={0.75}
          />

          {/* ===== Globe contents clipped to sphere ===== */}
          <g clipPath="url(#sphereClip)">
            <circle cx={center} cy={center} r={baseRadius} fill="url(#oceanShade)" />
            <circle cx={center} cy={center} r={baseRadius} fill="url(#atmo)" />
            <circle cx={center} cy={center} r={baseRadius} fill="url(#spec)" />

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
                        <circle cx={n.x} cy={n.y} r={r * 2.2} fill={`rgba(${routeColor},${0.10 + 0.05 * n.t})`} />
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
                      <path d={d} fill={glowGold} opacity={0.55} className="visited-pulse" filter="url(#goldGlow)" />
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
                      <g clipPath={`url(#${clipId})`} filter="url(#lightGlow)" className="visited-pulse">
                        {lightsByCountry[name].map((p, i) => (
                          <circle key={i} cx={p.x} cy={p.y} r={p.r} fill="#ffc83d" opacity={p.o} />
                        ))}
                      </g>
                    ) : null}
                  </g>
                );
              })}

              {/* Current pin */}
              {currentPoint ? (
                <g className="current-pin" transform={`translate(${currentPoint.x}, ${currentPoint.y})`}>
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
            0% {
              opacity: 0.55;
            }
            50% {
              opacity: 0.88;
            }
            100% {
              opacity: 0.55;
            }
          }

          @keyframes borderPulse {
            0% {
              stroke-opacity: 0.55;
            }
            50% {
              stroke-opacity: 0.92;
            }
            100% {
              stroke-opacity: 0.55;
            }
          }

          .current-pin {
            animation: pinFade 1.6s ease-in-out infinite;
            transform-origin: 0 0;
          }

          @keyframes pinFade {
            0% {
              opacity: 0.85;
            }
            50% {
              opacity: 1;
            }
            100% {
              opacity: 0.85;
            }
          }

          .pin-ring {
            animation: ringExpand 1.6s ease-out infinite;
            transform-origin: 0 0;
          }

          @keyframes ringExpand {
            0% {
              transform: scale(0.55);
              opacity: 0.75;
            }
            70% {
              transform: scale(1.45);
              opacity: 0;
            }
            100% {
              transform: scale(1.45);
              opacity: 0;
            }
          }

          .travel-pulse {
            stroke-dasharray: 6 18;
            animation: dashMove 3s linear infinite;
          }

          @keyframes dashMove {
            to {
              stroke-dashoffset: -140;
            }
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
