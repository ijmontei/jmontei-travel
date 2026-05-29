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
  monthLabel: string; // e.g. "October 2025"
  items: GalleryItem[];
};

export function GalleryFeed({ posts }: { posts: Post[] }) {
  const [selected, setSelected] = useState<GalleryItem | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll when popup modal is open
  useEffect(() => {
    if (selected) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [selected]);

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

  // 2. Group the sorted images into Month/Year chunks
  const groupedMonths = useMemo(() => {
    const groups: { [key: string]: GalleryItem[] } = {};

    sortedImages.forEach((item) => {
      let label = "Undated Memories";
      if (item.publishedAt) {
        const date = new Date(item.publishedAt);
        if (!isNaN(date.getTime())) {
          label = date.toLocaleDateString(undefined, {
            month: "long",
            year: "numeric",
          });
        }
      }

      if (!groups[label]) {
        groups[label] = [];
      }
      groups[label].push(item);
    });

    return Object.keys(groups).map((monthLabel) => ({
      monthLabel,
      items: groups[monthLabel],
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
      {/* Gallery Layout with Sticky Side Date Tracker */}
      <div className="relative mt-8 flex flex-col gap-6 md:flex-row md:items-start">
        
        {/* Main Feed Container */}
        <div className="w-full space-y-12">
          {groupedMonths.map((group, groupIdx) => (
            <div 
              key={group.monthLabel} 
              className="flex flex-col gap-4 md:flex-row md:items-start"
            >
              
              {/* STICKY SIDEBAR: Shows the Date/Month of the current block */}
              <div className="md:sticky md:top-24 md:w-48 shrink-0 py-2">
                <div className="flex items-center gap-3 md:flex-col md:items-start md:gap-1">
                  {/* Visual Timeline Node Dot */}
                  <div className="hidden h-2.5 w-2.5 rounded-full bg-[#414141] ring-4 ring-[#f5de88]/30 md:block" />
                  
                  {/* The Date Typography */}
                  <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-400 md:mt-2">
                    {group.monthLabel.split(" ")[0]}
                  </h4>
                  <span className="text-xl font-extrabold text-zinc-800 md:text-2xl">
                    {group.monthLabel.split(" ")[1] || ""}
                  </span>
                </div>
                {/* Vertical Connector Line */}
                <div className="hidden md:block ml-[4px] mt-4 h-16 w-px bg-zinc-200/80" />
              </div>

              {/* Grid Wrapper for images belonging to this month */}
              <div className="grid flex-1 grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {group.items.map((item, idx) => {
                  const imageUrl = item.image && item.image.asset
                    ? urlForImage(item.image).width(1200).url()
                    : null;

                  if (!imageUrl) return null;

                  return (
                    <button
                      key={`${item.slug}-${groupIdx}-${idx}`}
                      type="button"
                      onClick={() => setSelected(item)}
                      className="group relative block w-full overflow-hidden rounded-2xl bg-zinc-100 shadow-sm"
                    >
                      <div className="aspect-square relative w-full h-full">
                        <Image
                          src={imageUrl}
                          alt={item.image?.alt || item.postTitle}
                          fill
                          className="object-cover transition duration-500 group-hover:scale-[1.03]"
                        />
                      </div>

                      {/* Overlay text on hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                      <div className="absolute inset-x-0 bottom-0 p-3 text-left opacity-0 transition-opacity duration-300 group-hover:opacity-100 z-10">
                        <div className="text-[10px] font-medium uppercase tracking-wide text-zinc-300">
                          {[item.city, item.country].filter(Boolean).join(", ")}
                        </div>
                        <div className="mt-0.5 line-clamp-1 text-xs font-semibold text-white">
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
      </div>

      {/* PORTAL MODAL */}
      {mounted && selected && selected.image && selected.image.asset
        ? createPortal(
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
              onClick={() => setSelected(null)}
            >
              <div
                className="relative max-h-[95vh] w-full max-w-5xl overflow-hidden rounded-3xl bg-black"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close Button */}
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
            </div>,
            document.body
          )
        : null}
    </>
  );
}