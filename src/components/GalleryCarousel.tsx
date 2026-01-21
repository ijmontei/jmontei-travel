"use client";

import Image from "next/image";
import React, { useEffect, useState } from "react";
import { urlForImage } from "@/lib/sanity.image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

type Props = {
  title?: string;
  images: any[];
};

export function GalleryCarousel({ title = "Gallery", images }: Props) {
  if (!images?.length) return null;

  const [api, setApi] = useState<any>(null);
  const [active, setActive] = useState(0);
  const [showHint, setShowHint] = useState(true);

  useEffect(() => {
    if (!api) return;

    const onSelect = () => {
      setActive(api.selectedScrollSnap());
      setShowHint(false); // hide hint after first interaction
    };

    onSelect();
    api.on("select", onSelect);

    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  const total = images.length;

  return (
    <section className="mt-12">
      <div className="flex items-end justify-between gap-3">
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>

        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <span>
            {active + 1}/{total}
          </span>

          {showHint && total > 1 ? (
            <span className="rounded-full border bg-white/80 px-2 py-0.5">
              Swipe →
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-4 relative">
        {/* Right-edge gradient swipe cue (mobile only) */}
        {total > 1 ? (
          <div className="pointer-events-none absolute inset-y-0 right-0 w-12 sm:hidden z-10 bg-gradient-to-l from-white/90 to-transparent" />
        ) : null}

        <Carousel opts={{ align: "start", loop: total > 1 }} setApi={setApi}>
          <CarouselContent>
            {images.map((img, idx) => {
              const url =
                img?.asset
                  ? urlForImage(img).width(2000).fit("max").auto("format").url()
                  : null;

              if (!url) return null;

              return (
                <CarouselItem key={img?._key ?? idx}>
                  <figure className="rounded-2xl border bg-zinc-50 overflow-hidden">
                    {/* Fixed stage height; contain = no cropping */}
                    <div className="relative h-[420px] sm:h-[520px] bg-zinc-100">
                      <Image
                        src={url}
                        alt={img?.alt || `Photo ${idx + 1}`}
                        fill
                        className="object-contain"
                        sizes="(max-width: 768px) 100vw, 768px"
                        priority={idx === 0}
                      />
                    </div>

                    {img?.caption ? (
                      <figcaption className="px-4 py-3 text-sm text-zinc-600">
                        {img.caption}
                      </figcaption>
                    ) : null}
                  </figure>
                </CarouselItem>
              );
            })}
          </CarouselContent>

          {/* Desktop arrows; swipe works on mobile */}
          <CarouselPrevious className="hidden sm:flex" />
          <CarouselNext className="hidden sm:flex" />
        </Carousel>

        {/* Dots */}
        {total > 1 ? (
          <div className="mt-4 flex justify-center gap-2">
            {Array.from({ length: total }).map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => api?.scrollTo?.(i)}
                className={[
                  "h-2.5 w-2.5 rounded-full transition",
                  i === active ? "bg-zinc-900" : "bg-zinc-300 hover:bg-zinc-400",
                ].join(" ")}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
