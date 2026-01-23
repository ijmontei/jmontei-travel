export function AmbientBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-50"
      style={{
        backgroundImage: `
          radial-gradient(900px 500px at 12% 8%, rgba(194, 228, 200, 0.8), transparent 55%),
          radial-gradient(900px 500px at 88% 18%, rgba(215, 241, 209, 0.8), transparent 60%),
          radial-gradient(800px 500px at 40% 92%, rgba(206, 236, 242, 0.8), transparent 55%),
          radial-gradient(rgba(212, 226, 222, 0.8) 1px, transparent 1px)
        `,
        backgroundSize: "auto, auto, auto, 22px 22px",
      }}
    />
  );
}
