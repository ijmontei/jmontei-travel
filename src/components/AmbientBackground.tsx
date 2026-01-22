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

      {/* Sketch + map overlay */}
      <div className="absolute inset-0 opacity-[0.28] mix-blend-multiply">
        <svg
          className="h-full w-full"
          viewBox="0 0 1200 800"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            {/* Paper grain dots */}
            <pattern id="paperDots" width="18" height="18" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="0.8" fill="rgba(0,0,0,0.10)" />
              <circle cx="12" cy="9" r="0.6" fill="rgba(0,0,0,0.06)" />
            </pattern>

            {/* Subtle watercolor washes for “theme” */}
            <radialGradient id="washWarm" cx="30%" cy="15%" r="70%">
              <stop offset="0%" stopColor="rgba(245, 158, 11, 0.18)" />
              <stop offset="65%" stopColor="rgba(245, 158, 11, 0)" />
            </radialGradient>
            <radialGradient id="washCool" cx="80%" cy="18%" r="70%">
              <stop offset="0%" stopColor="rgba(6, 182, 212, 0.16)" />
              <stop offset="65%" stopColor="rgba(6, 182, 212, 0)" />
            </radialGradient>
            <radialGradient id="washGreen" cx="55%" cy="92%" r="70%">
              <stop offset="0%" stopColor="rgba(16, 185, 129, 0.12)" />
              <stop offset="65%" stopColor="rgba(16, 185, 129, 0)" />
            </radialGradient>

            {/* Mask: strongest under globe area, fades down into content */}
            <radialGradient id="heroFocus" cx="50%" cy="36%" r="70%">
              <stop offset="0%" stopColor="white" stopOpacity="0.78" />
              <stop offset="55%" stopColor="white" stopOpacity="0.42" />
              <stop offset="100%" stopColor="white" stopOpacity="0.10" />
            </radialGradient>
            <linearGradient id="fadeDown" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="white" stopOpacity="0.62" />
              <stop offset="50%" stopColor="white" stopOpacity="0.34" />
              <stop offset="100%" stopColor="white" stopOpacity="0.08" />
            </linearGradient>

            <mask id="sketchMask">
              <rect x="0" y="0" width="1200" height="800" fill="url(#fadeDown)" />
              <rect x="0" y="0" width="1200" height="800" fill="url(#heroFocus)" />
            </mask>

            {/* Line styles */}
            <style>{`
              .ink {
                fill: none;
                stroke: rgba(0,0,0,0.58);
                stroke-width: 2;
                stroke-linecap: round;
                stroke-linejoin: round;
              }
              .soft {
                stroke: rgba(0,0,0,0.38);
                stroke-width: 1.6;
              }
              .faint {
                stroke: rgba(0,0,0,0.22);
                stroke-width: 1.2;
              }
              .topo {
                stroke: rgba(0,0,0,0.18);
                stroke-width: 1.15;
                stroke-dasharray: 2 6;
              }
              .stamp {
                fill: rgba(0,0,0,0.08);
                stroke: rgba(0,0,0,0.22);
                stroke-width: 1.2;
              }
              .label {
                font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial;
                font-size: 12px;
                letter-spacing: 0.18em;
                fill: rgba(0,0,0,0.22);
              }
              .micro {
                font-size: 10px;
                letter-spacing: 0.12em;
                fill: rgba(0,0,0,0.18);
              }

              /* Planes motion */
              .plane1 { animation: planeDrift1 26s linear infinite; }
              .plane2 { animation: planeDrift2 34s linear infinite; }
              @keyframes planeDrift1 {
                0%   { transform: translate(-120px, 30px) rotate(6deg); opacity: 0; }
                12%  { opacity: 0.34; }
                50%  { transform: translate(560px, -6px) rotate(2deg); opacity: 0.34; }
                88%  { opacity: 0.34; }
                100% { transform: translate(1240px, 40px) rotate(6deg); opacity: 0; }
              }
              @keyframes planeDrift2 {
                0%   { transform: translate(1260px, 150px) rotate(-8deg); opacity: 0; }
                12%  { opacity: 0.26; }
                50%  { transform: translate(620px, 132px) rotate(-4deg); opacity: 0.26; }
                88%  { opacity: 0.26; }
                100% { transform: translate(-160px, 170px) rotate(-8deg); opacity: 0; }
              }

              /* Dotted trail subtle “march” */
              .trail {
                stroke-dasharray: 1 10;
                animation: trailMove 10s linear infinite;
              }
              @keyframes trailMove {
                to { stroke-dashoffset: -180; }
              }

              @media (prefers-reduced-motion: reduce) {
                .plane1, .plane2, .trail { animation: none !important; opacity: 0.20 !important; }
              }
            `}</style>
          </defs>

          {/* Paper texture */}
          <rect x="0" y="0" width="1200" height="800" fill="url(#paperDots)" opacity="0.14" />

          {/* Color washes (very soft) */}
          <rect x="0" y="0" width="1200" height="800" fill="url(#washWarm)" opacity="0.55" />
          <rect x="0" y="0" width="1200" height="800" fill="url(#washCool)" opacity="0.55" />
          <rect x="0" y="0" width="1200" height="800" fill="url(#washGreen)" opacity="0.45" />

          <g mask="url(#sketchMask)">
            {/* --- MAP GRID ARCS (latitude/longitude vibe) --- */}
            <path className="faint" d="M-40,210 C260,80 560,60 1240,210" />
            <path className="faint" d="M-40,260 C260,120 560,100 1240,260" />
            <path className="faint" d="M-40,310 C260,170 560,150 1240,310" />
            <path className="faint" d="M240,-40 C160,140 160,420 240,860" />
            <path className="faint" d="M360,-40 C280,140 280,420 360,860" />
            <path className="faint" d="M480,-40 C400,140 400,420 480,860" />

            {/* --- TOPO CONTOURS (curves) --- */}
            <path className="topo" d="M40,560 C160,520 280,520 420,560 C540,594 670,602 820,560 C960,516 1090,520 1210,560" />
            <path className="topo" d="M30,605 C170,570 290,570 430,606 C560,640 690,648 840,606 C980,564 1100,570 1220,605" />
            <path className="topo" d="M70,650 C210,624 340,624 470,650 C610,678 720,684 860,650 C1010,614 1120,620 1220,650" />
            <path className="topo" d="M110,695 C260,674 410,678 550,700 C690,720 820,722 960,700 C1080,682 1160,682 1220,695" />

            {/* Top-left contour cluster */}
            <path className="topo" d="M60,140 C140,110 220,112 300,140 C360,162 420,162 500,140" />
            <path className="topo" d="M52,170 C150,140 240,140 320,170 C380,194 440,194 520,170" />
            <path className="topo" d="M66,200 C170,176 260,176 340,200 C400,224 460,224 540,200" />

            {/* --- MOUNTAINS (lots of layers) --- */}
            {/* Far ridge */}
            <path
              className="ink soft"
              d="M-60,360
                 C90,330 180,300 300,290
                 C420,280 500,300 560,275
                 C650,235 720,170 820,160
                 C940,150 1010,210 1120,190
                 C1180,180 1220,160 1260,145"
            />

            {/* Mid ridge */}
            <path
              className="ink"
              d="M-70,445
                 C110,410 220,360 340,345
                 C500,325 610,365 720,330
                 C860,285 980,285 1260,240"
            />

            {/* Fore ridge */}
            <path
              className="ink"
              d="M-60,560
                 C120,520 210,470 320,450
                 C410,435 480,450 540,420
                 C630,375 700,300 790,285
                 C870,270 940,340 1010,320
                 C1090,300 1160,240 1240,220"
            />
            <path
              className="ink soft"
              d="M-80,610
                 C140,590 240,560 360,545
                 C520,525 620,560 760,520
                 C900,480 1040,470 1260,430"
            />

            {/* Extra peaks and hatching */}
            <path className="ink soft" d="M760,520 C790,470 820,410 850,360 C880,325 915,305 950,292" />
            <path className="faint" d="M862,378 l18,22" />
            <path className="faint" d="M842,408 l18,22" />
            <path className="faint" d="M822,438 l18,22" />
            <path className="faint" d="M905,362 l-16,20" />
            <path className="faint" d="M928,342 l-16,20" />

            {/* --- NARRATIVE: TRAIL + SIGNPOST + BACKPACKER --- */}
            {/* Dotted trail leading up toward the globe zone */}
            <path
              className="ink soft trail"
              d="M160,740
                 C220,700 280,680 330,650
                 C410,600 470,560 520,520
                 C585,470 640,430 700,390
                 C760,350 820,320 900,300"
            />

            {/* Signpost */}
            <g transform="translate(170 710) rotate(-4)">
              <path className="ink" d="M0,0 L0,-58" />
              <path className="ink soft" d="M0,-58 L34,-70 L34,-50 L0,-42 Z" />
              <path className="ink soft" d="M0,-48 L-28,-58 L-28,-40 L0,-32 Z" />
              <path className="faint" d="M-18,-49 L-4,-49" />
              <path className="faint" d="M6,-59 L22,-59" />
            </g>

            {/* Backpacker silhouette (tiny) */}
            <g transform="translate(225 735) scale(1.05)">
              {/* head */}
              <circle cx="0" cy="-18" r="6" fill="rgba(0,0,0,0.46)" />
              {/* body */}
              <path className="ink" d="M0,-12 L0,18" />
              {/* arms */}
              <path className="ink soft" d="M0,-2 L-14,8" />
              <path className="ink soft" d="M0,-2 L12,10" />
              {/* legs */}
              <path className="ink" d="M0,18 L-10,38" />
              <path className="ink" d="M0,18 L12,38" />
              {/* backpack */}
              <path
                className="ink soft"
                d="M-12,-10
                   C-18,-6 -18,16 -12,22
                   L-2,22
                   C-6,12 -6,0 -2,-10 Z"
              />
              {/* trekking pole */}
              <path className="ink faint" d="M14,8 L22,44" />
            </g>

            {/* --- STAMPS / PASSPORT STYLE --- */}
            <g transform="translate(900 120) rotate(8)">
              <rect className="stamp" x="-80" y="-42" width="160" height="84" rx="10" />
              <text className="label" x="-62" y="-10">
                TRAVEL LOG
              </text>
              <text className="label micro" x="-62" y="14">
                ENTRY • EXIT • STAMP
              </text>
              <circle cx="58" cy="0" r="18" fill="none" stroke="rgba(0,0,0,0.18)" strokeWidth="1.2" />
              <path className="faint" d="M46,0 L70,0" />
              <path className="faint" d="M58,-12 L58,12" />
            </g>

            <g transform="translate(1040 300) rotate(-10)">
              <circle className="stamp" cx="0" cy="0" r="38" />
              <circle cx="0" cy="0" r="30" fill="none" stroke="rgba(0,0,0,0.16)" strokeWidth="1.2" />
              <text className="label micro" x="-26" y="4">
                POSTMARK
              </text>
            </g>

            {/* --- PLANES --- */}
            <g className="plane1">
              <path
                className="ink soft"
                d="M40,110 l26,10 l40,-16 l-40,-6 l-26,-14 l-6,8 l14,10 l-14,6 z"
              />
              <path className="faint" d="M40,110 C120,120 180,90 260,86" />
            </g>

            <g className="plane2">
              <path
                className="ink soft"
                d="M1040,210 l24,9 l36,-14 l-36,-6 l-24,-13 l-6,8 l13,9 l-13,6 z"
              />
              <path className="faint" d="M1040,210 C960,230 900,200 820,194" />
            </g>

            {/* --- COMPASS / MAP MARKER --- */}
            <g transform="translate(130 130) rotate(-8)">
              <circle className="ink soft" cx="0" cy="0" r="30" />
              <path className="ink faint" d="M0,-24 L0,24" />
              <path className="ink faint" d="M-24,0 L24,0" />
              <path className="faint" d="M0,-24 L6,-6 L0,-10 L-6,-6 Z" />
              <text className="label micro" x="-16" y="54">
                NORTH
              </text>
            </g>

            {/* Little “x marks the spot” */}
            <g transform="translate(330 260) rotate(10)">
              <path className="ink faint" d="M-10,-10 L10,10" />
              <path className="ink faint" d="M10,-10 L-10,10" />
              <text className="label micro" x="-28" y="26">
                CAMP
              </text>
            </g>
          </g>
        </svg>
      </div>

      {/* Vignette for readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/[0.02] via-transparent to-black/[0.05]" />
    </div>
  );
}
