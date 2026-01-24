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

function wrap(v: number, size: number) {
  return ((v % size) + size) % size;
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
  const panRef = useRef({ x: 0, y: 0 });
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

  // ===== Space / cosmic backdrop tuning =====
  const SPACE_SCALE = 3.2; // bigger = less "boxed" / more infinite feel
  const spaceW = size * SPACE_SCALE;
  const spaceH = size * SPACE_SCALE;

  const [spaceOffset, setSpaceOffset] = useState({ x: 0, y: 0 });
  const lastRotLonRef = useRef(0);
  const lastRotTRef = useRef<number | null>(null);

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

  // Make background "space" drift with rotation direction (infinite wrap)
  useEffect(() => {
    const now = performance.now();
    const lastT = lastRotTRef.current ?? now;
    const dt = Math.max((now - lastT) / 1000, 1 / 240);
    lastRotTRef.current = now;

    const prev = lastRotLonRef.current;
    let d = rotLon - prev;
    if (d > 180) d -= 360;
    if (d < -180) d += 360;
    lastRotLonRef.current = rotLon;

    const vel = d / dt; // deg/sec (signed)

    // Convert signed velocity to parallax drift. Clamp to keep it subtle.
    const dx = clamp(vel * 0.45, -16, 16); // "px per second-ish"
    const dy = clamp((rotLat - DEFAULT_TILT) * 0.06, -3, 3);

    // accumulate; we'll wrap per-element at render time
    setSpaceOffset((p) => ({ x: p.x + dx * dt * 60, y: p.y + dy * dt * 60 }));
  }, [rotLon, rotLat]);

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
  projection.rotate([rotLon, rotLat]);

  const pathGen = geoPath(projection);

  // Palette (globe)
  const oceanA = "#050b15";
  const oceanB = "#0b1a33";
  const landBase = "rgba(255,255,255,0.04)";
  const border = "rgba(170, 195, 230, 0.14)";
  const glowGold = "#f5de88";

  const routeColor = "80, 200, 255";
  const visitedBorder = "#945f10";

  const viewCenterLonLat = useMemo<[number, number]>(() => [-rotLon, -rotLat], [rotLon, rotLat]);

  // ===== Stars + nebula (generated in oversized "space field" so it's never boxed) =====
  const stars = useMemo(() => {
    const rand = mulberry32(hashString("stars-v3"));
    const pts: { x: number; y: number; r: number; o: number; tw: number }[] = [];
    const n = 320;

    for (let i = 0; i < n; i++) {
      const x = rand() * spaceW;
      const y = rand() * spaceH;

      // many small, few big
      const t = rand();
      const r = t < 0.92 ? 0.35 + rand() * 0.9 : 1.1 + rand() * 1.6;
      const o = t < 0.92 ? 0.03 + rand() * 0.09 : 0.12 + rand() * 0.22;
      const tw = rand(); // twinkle phase variance

      pts.push({ x, y, r, o, tw });
    }
    return pts;
  }, [spaceW, spaceH]);

  const nebulaDust = useMemo(() => {
    const rand = mulberry32(hashString("nebula-v3"));
    const pts: { x: number; y: number; r: number; o: number; kind: number }[] = [];
    const n = 56;

    for (let i = 0; i < n; i++) {
      const x = rand() * spaceW;
      const y = rand() * spaceH;
      const r = 42 + rand() * 110;
      const o = 0.012 + rand() * 0.055;
      const kind = rand(); // pick hue family
      pts.push({ x, y, r, o, kind });
    }
    return pts;
  }, [spaceW, spaceH]);

  // City lights per visited country
  const lightsByCountry = useMemo(() => {
    const out: Record<string, { x: number; y: number; r: number; o: number }[]> = {};

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
      // pinch zoom
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

      // one-finger rotate (always)
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

    // Pointer (mouse) drag rotate ALWAYS
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

  // Cursor feedback: now draggable at all times
  const cursorClass = "cursor-grab active:cursor-grabbing";

  // Space disc sizing (behind planet)
  const spaceDiscR = baseRadius * 2.05;

  return (
    <div className="mt-0">
      <div
        ref={containerRef}
        className={[
          // Give the halo room so the diffusion reads nicely (feel free to dial these back)
          "relative w-[260px] h-[260px] sm:w-[300px] sm:h-[300px] md:w-[360px] md:h-[360px] mx-auto select-none",
          cursorClass,
        ].join(" ")}
        style={{ touchAction: "none" }}
        aria-label="Interactive globe. Scroll/pinch to zoom, drag to rotate."
        title="Scroll/pinch to zoom • Drag to rotate"
      >
        <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full block" style={{ overflow: "visible" }}>
          <defs>
            {/* ========= COSMIC BACKDROP (infinite parallax) ========= */}
            <clipPath id="spaceDisc">
              <circle cx={center} cy={center} r={spaceDiscR} />
            </clipPath>

            {/* Soft fade so disc dissolves into page background */}
            <radialGradient id="spaceFade" cx="50%" cy="50%" r="70%">
              <stop offset="0%" stopColor="rgba(255,255,255,1)" />
              <stop offset="72%" stopColor="rgba(255,255,255,0.95)" />
              <stop offset="90%" stopColor="rgba(255,255,255,0.25)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </radialGradient>
            <mask id="spaceFadeMask">
              <circle cx={center} cy={center} r={spaceDiscR} fill="url(#spaceFade)" />
            </mask>

            {/* Void-black base halo */}
            <radialGradient id="voidHalo" cx="50%" cy="50%" r="70%">
              <stop offset="0%" stopColor="rgba(0,0,0,0.96)" />
              <stop offset="32%" stopColor="rgba(0,0,0,0.80)" />
              <stop offset="60%" stopColor="rgba(0,0,0,0.42)" />
              <stop offset="82%" stopColor="rgba(0,0,0,0.14)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0)" />
            </radialGradient>

            {/* Blue cosmic band vibes (inspired by your reference) */}
            <radialGradient id="celestialA" cx="42%" cy="42%" r="80%">
              <stop offset="0%" stopColor="rgba(70, 140, 255, 0.10)" />
              <stop offset="38%" stopColor="rgba(65, 120, 255, 0.06)" />
              <stop offset="72%" stopColor="rgba(0,0,0,0)" />
            </radialGradient>
            <radialGradient id="celestialB" cx="60%" cy="56%" r="85%">
              <stop offset="0%" stopColor="rgba(120, 170, 255, 0.08)" />
              <stop offset="46%" stopColor="rgba(90, 140, 255, 0.04)" />
              <stop offset="78%" stopColor="rgba(0,0,0,0)" />
            </radialGradient>

            {/* Slight blur for nebula dust */}
            <filter id="nebulaBlur" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="14" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* ========= GLOBE SHADING ========= */}
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

            {/* Atmosphere glow (boosted + bluer to match your reference) */}
            <radialGradient id="atmo" cx="42%" cy="36%" r="85%">
              <stop offset="0%" stopColor="rgba(120,190,255,0.08)" />
              <stop offset="55%" stopColor="rgba(120,190,255,0.03)" />
              <stop offset="100%" stopColor="rgba(120,190,255,0)" />
            </radialGradient>

            {/* Outer rim aura (blue halo ring like your reference) */}
            <radialGradient id="rimAura" cx="50%" cy="50%" r="52%">
              <stop offset="0%" stopColor="rgba(90,160,255,0)" />
              <stop offset="72%" stopColor="rgba(90,160,255,0.00)" />
              <stop offset="86%" stopColor="rgba(90,160,255,0.22)" />
              <stop offset="100%" stopColor="rgba(90,160,255,0.00)" />
            </radialGradient>

            {/* Specular highlight */}
            <radialGradient id="spec" cx="30%" cy="28%" r="55%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.14)" />
              <stop offset="40%" stopColor="rgba(255,255,255,0.05)" />
              <stop offset="70%" stopColor="rgba(255,255,255,0)" />
            </radialGradient>

            {/* Clip to the fixed visible sphere */}
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
              <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#000" floodOpacity="0.14" />
            </filter>

            {/* Slight glow for the aura ring */}
            <filter id="auraGlow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="4.5" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* ========= COSMIC DISC (behind globe, infinite parallax, NOT boxed) ========= */}
          <g clipPath="url(#spaceDisc)" mask="url(#spaceFadeMask)">
            {/* base void */}
            <rect x={0} y={0} width={size} height={size} fill="rgba(0,0,0,0.78)" />

            {/* large soft halo */}
            <circle cx={center} cy={center} r={spaceDiscR} fill="url(#voidHalo)" />

            {/* subtle blue cosmic tints (stays centered, helps match reference vibe) */}
            <rect x={0} y={0} width={size} height={size} fill="url(#celestialA)" opacity={0.95} />
            <rect x={0} y={0} width={size} height={size} fill="url(#celestialB)" opacity={0.9} />

            {(() => {
              // wrap offsets so motion is infinite
              const nebX = wrap(spaceOffset.x * 0.55, spaceW);
              const nebY = wrap(spaceOffset.y * 0.55, spaceH);
              const starX = wrap(spaceOffset.x * 1.0, spaceW);
              const starY = wrap(spaceOffset.y * 1.0, spaceH);

              const baseX = center - spaceW / 2;
              const baseY = center - spaceH / 2;

              return (
                <>
                  {/* nebula dust (slow parallax, super subtle + blurred) */}
                  <g opacity={0.62} filter="url(#nebulaBlur)">
                    {nebulaDust.map((p, i) => {
                      const x = baseX + wrap(p.x + nebX, spaceW);
                      const y = baseY + wrap(p.y + nebY, spaceH);

                      // blue-violet band look like reference
                      const fill =
                        p.kind < 0.55
                          ? "rgba(90, 150, 255, 1)"
                          : p.kind < 0.8
                          ? "rgba(80, 120, 255, 1)"
                          : "rgba(120, 170, 255, 1)";

                      return <circle key={`dust-${i}`} cx={x} cy={y} r={p.r} fill={fill} opacity={p.o} />;
                    })}
                  </g>

                  {/* stars (faster parallax, in front) */}
                  <g opacity={0.92} className="starfield">
                    {stars.map((s, i) => {
                      const x = baseX + wrap(s.x + starX, spaceW);
                      const y = baseY + wrap(s.y + starY, spaceH);
                      return (
                        <circle
                          key={`star-${i}`}
                          cx={x}
                          cy={y}
                          r={s.r}
                          fill="#ffffff"
                          opacity={s.o}
                          className={`twinkle tw-${Math.floor(s.tw * 6)}`}
                        />
                      );
                    })}
                  </g>
                </>
              );
            })()}
          </g>

          {/* ========= Planet shadow (subtle, helps "float") ========= */}
          <circle cx={center} cy={center} r={baseRadius} fill="transparent" filter="url(#sphereShadow)" />

          {/* ========= Globe (clipped) ========= */}
          <g clipPath="url(#sphereClip)">
            {/* Ocean fill */}
            <circle cx={center} cy={center} r={baseRadius} fill="url(#oceanShade)" />

            {/* Atmosphere + spec */}
            <circle cx={center} cy={center} r={baseRadius} fill="url(#atmo)" />
            <circle cx={center} cy={center} r={baseRadius} fill="url(#spec)" />

            {/* Pan the map layer ONLY (zoom already applied via projection.scale) */}
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

            {/* Terminator on top, clipped */}
            <circle cx={center} cy={center} r={baseRadius} fill="url(#terminator)" />
          </g>

          {/* ========= Outer rim aura (on top of globe) ========= */}
          <circle
            cx={center}
            cy={center}
            r={baseRadius * 1.02}
            fill="none"
            stroke="rgba(110, 175, 255, 0.55)"
            strokeWidth={1.25}
            opacity={0.22}
            filter="url(#auraGlow)"
          />
          <circle cx={center} cy={center} r={baseRadius * 1.02} fill="url(#rimAura)" opacity={0.85} />
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

          /* Subtle star twinkle (not sparkly) */
          .twinkle {
            animation: tw 7.5s ease-in-out infinite;
          }
          @keyframes tw {
            0% {
              opacity: 0.25;
            }
            50% {
              opacity: 0.9;
            }
            100% {
              opacity: 0.25;
            }
          }

          /* Stagger phases */
          .tw-0 {
            animation-delay: -0s;
          }
          .tw-1 {
            animation-delay: -1.1s;
          }
          .tw-2 {
            animation-delay: -2.2s;
          }
          .tw-3 {
            animation-delay: -3.3s;
          }
          .tw-4 {
            animation-delay: -4.4s;
          }
          .tw-5 {
            animation-delay: -5.5s;
          }

          ${Array.from({ length: 24 })
            .map((_, i) => `.travel-pulse-${i} { animation-delay: -${i * 0.18}s; }`)
            .join("\n")}

          @media (prefers-reduced-motion: reduce) {
            .visited-pulse,
            .visited-border-pulse,
            .current-pin,
            .pin-ring,
            .travel-pulse,
            .twinkle {
              animation: none;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
