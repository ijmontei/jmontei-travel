export function AmbientBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* Base gradient + grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            radial-gradient(900px 500px at 12% 8%, rgba(245, 158, 11, 0.16), transparent 55%),
            radial-gradient(900px 500px at 88% 18%, rgba(6, 182, 212, 0.14), transparent 60%),
            radial-gradient(800px 500px at 40% 92%, rgba(16, 185, 129, 0.10), transparent 55%),
            radial-gradient(rgba(0,0,0,0.028) 1px, transparent 1px)
          `,
          backgroundSize: "auto, auto, auto, 22px 22px",
        }}
      />

      {/* Sketch overlay */}
      <div className="absolute inset-0 opacity-[0.14] mix-blend-multiply">
        <svg
          className="h-full w-full"
          viewBox="0 0 1200 800"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            {/* Slight “paper” noise via dots */}
            <pattern id="paperDots" width="22" height="22" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="0.9" fill="rgba(0,0,0,0.10)" />
            </pattern>

            {/* Very subtle fade so art doesn’t compete with content */}
            <linearGradient id="fadeDown" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(0,0,0,0.40)" />
              <stop offset="45%" stopColor="rgba(0,0,0,0.22)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0.00)" />
            </linearGradient>

            {/* Line style */}
            <style>{`
              .sketch-line {
                fill: none;
                stroke: rgba(0,0,0,0.55);
                stroke-width: 2;
                stroke-linecap: round;
                stroke-linejoin: round;
              }
              .sketch-soft {
                stroke: rgba(0,0,0,0.35);
                stroke-width: 1.5;
              }
              .hatch {
                stroke: rgba(0,0,0,0.30);
                stroke-width: 1.2;
              }

              /* Plane motion (super subtle) */
              .plane1 {
                animation: planeDrift1 24s linear infinite;
              }
              .plane2 {
                animation: planeDrift2 32s linear infinite;
              }
              @keyframes planeDrift1 {
                0%   { transform: translate(-80px, 20px) rotate(6deg); opacity: 0.0; }
                10%  { opacity: 0.35; }
                50%  { transform: translate(520px, -10px) rotate(2deg); opacity: 0.35; }
                90%  { opacity: 0.35; }
                100% { transform: translate(1180px, 30px) rotate(6deg); opacity: 0.0; }
              }
              @keyframes planeDrift2 {
                0%   { transform: translate(1240px, 140px) rotate(-8deg); opacity: 0.0; }
                12%  { opacity: 0.28; }
                50%  { transform: translate(620px, 120px) rotate(-4deg); opacity: 0.28; }
                88%  { opacity: 0.28; }
                100% { transform: translate(-120px, 160px) rotate(-8deg); opacity: 0.0; }
              }

              @media (prefers-reduced-motion: reduce) {
                .plane1, .plane2 { animation: none !important; opacity: 0.18 !important; }
              }
            `}</style>

            {/* Mask to fade the whole sketch downward */}
            <mask id="sketchMask">
              <rect x="0" y="0" width="1200" height="800" fill="url(#fadeDown)" />
            </mask>
          </defs>

          {/* Optional paper dots overlay (very faint) */}
          <rect x="0" y="0" width="1200" height="800" fill="url(#paperDots)" opacity="0.10" />

          <g mask="url(#sketchMask)">
            {/* Mountains (silhouette line art) */}
            <path
              className="sketch-line"
              d="M-40,560
                 C120,520 210,470 320,450
                 C410,435 480,450 540,420
                 C630,375 700,300 790,285
                 C870,270 940,340 1010,320
                 C1090,300 1160,240 1240,220"
            />
            <path
              className="sketch-line sketch-soft"
              d="M-60,610
                 C160,590 240,560 360,545
                 C520,525 620,560 760,520
                 C900,480 1040,470 1260,430"
            />

            {/* Peak details + hatching */}
            <path
              className="sketch-line sketch-soft"
              d="M760,520
                 C790,470 820,410 850,360
                 C870,330 900,310 930,300"
            />
            <path className="hatch" d="M860,380 l18,22" />
            <path className="hatch" d="M840,410 l18,22" />
            <path className="hatch" d="M820,440 l18,22" />
            <path className="hatch" d="M900,360 l-16,20" />
            <path className="hatch" d="M920,340 l-16,20" />

            {/* Cabin + trail (tiny) */}
            <g transform="translate(820 585) scale(0.95)">
              <path className="sketch-line" d="M0,40 L70,40 L70,12 L0,12 Z" />
              <path className="sketch-line" d="M-6,12 L35,-8 L76,12" />
              <path className="sketch-soft sketch-line" d="M44,40 L44,22 L58,22 L58,40" />
              <path className="sketch-soft sketch-line" d="M8,40 L8,26 L22,26 L22,40" />
              <path className="sketch-soft sketch-line" d="M-120,80 C-50,55 20,55 120,40" />
            </g>

            {/* Trees (simple sketch triangles) */}
            <g transform="translate(720 600)">
              {Array.from({ length: 7 }).map((_, i) => {
                const x = i * 28;
                const s = 0.85 + (i % 3) * 0.08;
                return (
                  <g key={i} transform={`translate(${x} ${0}) scale(${s})`}>
                    <path className="sketch-line sketch-soft" d="M10,45 L10,60" />
                    <path className="sketch-line" d="M10,10 L-2,30 L22,30 Z" />
                    <path className="sketch-line" d="M10,20 L-6,44 L26,44 Z" />
                  </g>
                );
              })}
            </g>

            {/* Planes (tiny outline icons) */}
            <g className="plane1" transform="translate(0 0)">
              <path
                className="sketch-line sketch-soft"
                d="M40,110 l26,10 l40,-16 l-40,-6 l-26,-14 l-6,8 l14,10 l-14,6 z"
              />
            </g>

            <g className="plane2" transform="translate(0 0)">
              <path
                className="sketch-line sketch-soft"
                d="M1040,210 l24,9 l36,-14 l-36,-6 l-24,-13 l-6,8 l13,9 l-13,6 z"
              />
            </g>

            {/* A subtle “compass / trail mark” accent top-left */}
            <g transform="translate(120 140) rotate(-8)">
              <circle className="sketch-line sketch-soft" cx="0" cy="0" r="30" />
              <path className="sketch-line sketch-soft" d="M0,-24 L0,24" />
              <path className="sketch-line sketch-soft" d="M-24,0 L24,0" />
              <path className="sketch-line hatch" d="M0,-24 L6,-6 L0,-10 L-6,-6 Z" />
            </g>
          </g>
        </svg>
      </div>

      {/* A subtle vignette so content reads cleanly */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/[0.02] via-transparent to-black/[0.04]" />
    </div>
  );
}
