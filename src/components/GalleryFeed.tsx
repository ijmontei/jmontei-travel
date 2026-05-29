"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { createPortal } from "react-dom";
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

type GroupedMonth = {
  monthLabel: string;
  shortDateLabel: string;
  items: GalleryItem[];
};

export function GalleryFeed({ posts }: { posts: Post[] }) {
  const [selected, setSelected] = useState<GalleryItem | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 1. Flatten and Sort all images by date (Newest First)
  const sortedImages = useMemo(() => {
    return posts
      .flatMap((post) =>
        (post.gallery || []).map((image: any) => ({
          image,
          postTitle: post.title,
          slug: post.slug,
          country: post.country,
          city: post.city,
          publishedAt: post.publishedAt,
        }))
      )
      .sort((a, b) => {
        const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
        const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
        return dateB - dateA;
      });
  }, [posts]);

  // Modal Navigation Logic
  const currentIndex = selected
    ? sortedImages.findIndex((img) => img === selected)
    : -1;
  const hasNext = currentIndex !== -1 && currentIndex < sortedImages.length - 1;
  const hasPrev = currentIndex !== -1 && currentIndex > 0;

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (hasNext) setSelected(sortedImages[currentIndex + 1]);
  };

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (hasPrev) setSelected(sortedImages[currentIndex - 1]);
  };

  // Lock body scroll & handle keyboard events when popup modal is open
  useEffect(() => {
    if (selected) {
      document.body.style.overflow = "hidden";

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "ArrowRight") handleNext();
        if (e.key === "ArrowLeft") handlePrev();
        if (e.key === "Escape") setSelected(null);
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = "";
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
    return () => {
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, currentIndex]);

  // 2. Group the sorted images into Month chunks with custom "Mmm-yy" labels
  const groupedMonths = useMemo(() => {
    const groups: {
      [key: string]: { shortLabel: string; items: GalleryItem[] };
    } = {};

    sortedImages.forEach((item) => {
      let monthKey = "Undated";
      let shortLabel = "Memories";

      if (item.publishedAt) {
        const date = new Date(item.publishedAt);
        if (!isNaN(date.getTime())) {
          monthKey = `${date.getFullYear()}-${date.getMonth()}`;
          const monthStr = date.toLocaleDateString(undefined, {
            month: "short",
          });
          const yearStr = date.toLocaleDateString(undefined, {
            year: "2-digit",
          });
          shortLabel = `${monthStr}-${yearStr}`;
        }
      }

      if (!groups[monthKey]) {
        groups[monthKey] = { shortLabel, items: [] };
      }
      groups[monthKey].items.push(item);
    });

    return Object.keys(groups).map((key) => ({
      monthLabel: key,
      shortDateLabel: groups[key].shortLabel,
      items: groups[key].items,
    })) as GroupedMonth[];
  }, [sortedImages]);

  if (!sortedImages.length) {
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
      {/* Feed Container */}
      <div className="mt-8 space-y-16">
        {groupedMonths.map((group, groupIdx) => (
          <div key={group.monthLabel} className="space-y-8">
            {/* HORIZONTAL TIMELINE BREAK */}
            <div className="relative flex items-center py-2 select-none">
              <div className="h-px flex-1 bg-zinc-200/80" />
              <div className="mx-4 flex items-center gap-2 rounded-full border border-zinc-200 bg-[#414141] px-4 py-1 shadow-sm transition-all duration-300 hover:scale-105">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#f5de88] opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#f5de88]"></span>
                </span>
                <span className="font-mono text-xs font-bold tracking-widest text-[#f5de88]">
                  {group.shortDateLabel}
                </span>
              </div>
              <div className="h-px flex-1 bg-zinc-200/80" />
            </div>

            {/* ARTISTIC BENTO GRID */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 auto-rows-[200px] grid-flow-dense gap-3 sm:gap-4">
              {group.items.map((item, idx) => {
                const imageUrl =
                  item.image && item.image.asset
                    ? urlForImage(item.image).width(1200).url()
                    : null;

                if (!imageUrl) return null;

                // Create an asymmetrical mosaic pattern
                let spanClasses = "col-span-1 row-span-1";
                if (idx % 6 === 0) spanClasses = "col-span-2 row-span-2"; // Large highlight piece
                else if (idx % 7 === 0) spanClasses = "col-span-2 row-span-1"; // Wide piece
                else if (idx % 5 === 0) spanClasses = "col-span-1 row-span-2"; // Tall piece

                return (
                  <button
                    key={`${item.slug}-${groupIdx}-${idx}`}
                    type="button"
                    onClick={() => setSelected(item)}
                    className={`group relative block w-full h-full overflow-hidden rounded-2xl bg-zinc-100 shadow-sm ${spanClasses}`}
                  >
                    <Image
                      src={imageUrl}
                      alt={item.image?.alt || item.postTitle}
                      fill
                      className="object-cover transition-all duration-700 ease-in-out group-hover:scale-110 group-hover:-rotate-1 group-hover:brightness-110"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                    {/* Text Container with slight slide-up animation */}
                    <div className="absolute inset-x-0 bottom-0 p-4 text-left translate-y-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 z-10">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-300">
                        {[item.city, item.country].filter(Boolean).join(", ")}
                      </div>
                      <div className="mt-1 line-clamp-1 text-sm font-semibold text-white drop-shadow-md">
                        {item.postTitle}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* PORTAL MODAL */}
      {mounted && selected && selected.image && selected.image.asset
        ? createPortal(
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-2 sm:p-6 backdrop-blur-md transition-all"
              onClick={() => setSelected(null)}
            >
              <div
                className="relative flex h-full max-h-[95vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl bg-zinc-950/80 shadow-2xl ring-1 ring-white/10"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Exit "X" Button - Top Right */}
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="absolute right-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md border border-white/10 transition-all duration-300 hover:rotate-90 hover:scale-110 hover:bg-white/10 hover:border-white/30 active:scale-95"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* Left/Right Navigation Arrows */}
                {hasPrev && (
                  <button
                    onClick={handlePrev}
                    className="absolute left-4 top-1/2 z-50 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md border border-white/10 transition-all duration-300 hover:-translate-x-1 hover:scale-110 hover:bg-white/10 hover:border-white/30 active:scale-95"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6 pr-0.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                  </button>
                )}

                {hasNext && (
                  <button
                    onClick={handleNext}
                    className="absolute right-4 top-1/2 z-50 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md border border-white/10 transition-all duration-300 hover:translate-x-1 hover:scale-110 hover:bg-white/10 hover:border-white/30 active:scale-95"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6 pl-0.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </button>
                )}

                {/* Image Container */}
                <div className="relative flex flex-1 items-center justify-center overflow-hidden p-4">
                  <Image
                    src={urlForImage(selected.image).width(2000).url()}
                    alt={selected.image?.alt || selected.postTitle}
                    width={2000}
                    height={2000}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>

                {/* Footer Data */}
                <div className="flex flex-col gap-4 border-t border-white/10 bg-zinc-950/50 px-6 py-5 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-widest text-zinc-400">
                      {[selected.city, selected.country]
                        .filter(Boolean)
                        .join(", ")}
                    </div>
                    <div className="mt-1 text-xl font-semibold text-white tracking-tight">
                      {selected.postTitle}
                    </div>
                  </div>

                  <Link
                    href={`/posts/${selected.slug}`}
                    className="inline-flex items-center justify-center rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-zinc-900 transition-all duration-300 hover:bg-zinc-200 hover:scale-105 active:scale-95"
                  >
                    Read Post →
                  </Link>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}