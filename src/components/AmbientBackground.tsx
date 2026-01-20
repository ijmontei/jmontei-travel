export function AmbientBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-50"
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
  );
}
