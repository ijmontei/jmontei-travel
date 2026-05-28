"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { Post } from "@/lib/types";
import { urlForImage } from "@/lib/sanity.image";

type GalleryItem = {
  image: any;
  postTitle: string;
  slug: string;
  country?: string | null;
  city?: string | null;
  publishedAt?: string | null;
};

export function GalleryFeed({ posts }: { posts: Post[] }) {
  const [selected, setSelected] = useState<GalleryItem | null>(null);

  const images = useMemo(() => {
    return posts.flatMap((post) =>
      (post.gallery || []).map((image: any) => ({
        image,
        postTitle: post.title,
        slug: post.slug,
        country: post.country,
        city: post.city,
        publishedAt: post.publishedAt,
      }))
    );
  }, [posts]);

  if (!images.length) {
    return (
      <div className="mt-10 rounded-3xl border bg-white/60 p-10 text-center shadow-sm">
        <h3 className="text-lg font-semibold text-zinc-900">
          No gallery photos yet
        </h3>

        <p className="mt-2 text-sm text-zinc-500">
          Add images to post galleries in Sanity to populate this feed.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Feed */}
      <section className="mt-6">
        <div className="columns-2 gap-4 sm:columns-3 lg:columns-4">
          {images.map((item, idx) => {
            const imageUrl = item.image
              ? urlForImage(item.image).width(1200).url()
              : null;

            if (!imageUrl) return null;

            return (
              <button
                key={`${item.slug}-${idx}`}
                type="button"
                onClick={() => setSelected(item)}
                className="group relative mb-4 block w-full overflow-hidden rounded-2xl bg-zinc-100 break-inside-avoid"
              >
                <Image
                  src={imageUrl}
                  alt={item.image?.alt || item.postTitle}
                  width={1200}
                  height={1600}
                  className="h-auto w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                />

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                <div className="absolute inset-x-0 bottom-0 p-4 text-left opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <div className="text-xs font-medium uppercase tracking-wide text-zinc-200">
                    {[item.city, item.country].filter(Boolean).join(", ")}
                  </div>

                  <div className="mt-1 line-clamp-2 text-sm font-semibold text-white">
                    {item.postTitle}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Modal */}
      {selected ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
          onClick={() => setSelected(null)}
        >
          <div
            className="relative max-h-[95vh] w-full max-w-5xl overflow-hidden rounded-3xl bg-black"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="absolute right-4 top-4 z-10 rounded-full bg-black/60 px-3 py-2 text-sm font-semibold text-white backdrop-blur hover:bg-black/80"
            >
              ✕
            </button>

            {/* Image */}
            <div className="relative flex max-h-[80vh] items-center justify-center">
              <Image
                src={urlForImage(selected.image).width(2000).url()}
                alt={selected.image?.alt || selected.postTitle}
                width={2000}
                height={2000}
                className="max-h-[80vh] w-auto object-contain"
              />
            </div>

            {/* Footer */}
            <div className="flex flex-col gap-4 border-t border-white/10 bg-zinc-950 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-xs uppercase tracking-wide text-zinc-400">
                  {[selected.city, selected.country]
                    .filter(Boolean)
                    .join(", ")}
                </div>

                <div className="mt-1 text-lg font-semibold text-white">
                  {selected.postTitle}
                </div>
              </div>

              <Link
                href={`/posts/${selected.slug}`}
                className="inline-flex items-center justify-center rounded-full bg-white px-5 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-200"
              >
                Read Post →
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}