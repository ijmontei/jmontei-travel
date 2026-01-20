export function Hero() {
  return (
    <section className="relative overflow-hidden rounded-3xl border bg-white">
      {/* background glow */}
      <div className="pointer-events-none absolute -top-28 -right-24 h-72 w-72 rounded-full bg-amber-200/60 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -left-24 h-72 w-72 rounded-full bg-rose-200/50 blur-3xl" />

      {/* subtle pattern */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.25] [background-image:radial-gradient(#00000012_1px,transparent_1px)] [background-size:22px_22px]" />

      <div className="relative px-7 py-10 sm:px-10 sm:py-14">
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">
              Two-year adventure
            </span>
            <span className="rounded-full border bg-white/70 px-3 py-1 text-xs font-medium text-zinc-700">
              Posts + Photos
            </span>
            <span className="rounded-full border bg-white/70 px-3 py-1 text-xs font-medium text-zinc-700">
              Follow along
            </span>
          </div>

          <div>
            <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight text-zinc-900">
              A+J Travels
            </h1>
            <p className="mt-3 max-w-2xl text-zinc-600 leading-relaxed">
              Stories, snapshots, and small moments from the road — organized by date
              or by country so family & friends can keep up easily.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href="#posts"
              className="inline-flex items-center justify-center rounded-full bg-amber-700 px-5 py-2 text-sm font-medium text-white shadow-sm
                         transition hover:bg-amber-800 hover:shadow-md active:scale-[0.99]"
            >
              Browse latest
            </a>

            <a
              href="#country"
              className="inline-flex items-center justify-center rounded-full border bg-white px-5 py-2 text-sm font-medium text-zinc-800
                         transition hover:bg-zinc-50 active:scale-[0.99]"
            >
              Browse by country
            </a>

            <div className="ml-auto hidden sm:flex items-center gap-2 text-xs text-zinc-500">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Updated as we go
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
