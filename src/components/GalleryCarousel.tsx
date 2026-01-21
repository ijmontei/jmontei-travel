"use client";

import Image from "next/image";
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

  return (
    <section className="mt-12">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>

      <div className="mt-4">
        <Carousel opts={{ align: "start", loop: images.length > 1 }}>
          <CarouselContent>
            {images.map((img, idx) => {
              const url =
                img?.asset ? urlForImage(img).width(2000).fit("max").auto("format").url() : null;

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

          <CarouselPrevious className="hidden sm:flex" />
          <CarouselNext className="hidden sm:flex" />
        </Carousel>
      </div>
    </section>
  );
}
