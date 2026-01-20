"use client";

import { useState } from "react";
import type { Post } from "@/lib/types";
import { PostCard } from "@/components/PostCard";

export function CountryAccordion({
  grouped,
}: {
  grouped: { country: string; posts: Post[] }[];
}) {
  const [open, setOpen] = useState<Record<string, boolean>>({});

  return (
    <div className="space-y-4">
      {grouped.map(({ country, posts }) => {
        const isOpen = !!open[country];

        return (
          <div
            key={country}
            className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden"
          >
            <button
              onClick={() => setOpen((p) => ({ ...p, [country]: !p[country] }))}
              className="w-full flex items-center justify-between px-5 py-4 text-left"
            >
              <div className="flex items-center gap-3">
                <span className="text-base font-semibold">{country}</span>
                <span className="text-xs text-[hsl(var(--muted))]">
                  {posts.length} post{posts.length === 1 ? "" : "s"}
                </span>
              </div>
              <span className="text-sm text-[hsl(var(--muted))]">
                {isOpen ? "Hide" : "Show"}
              </span>
            </button>

            {isOpen && (
              <div className="px-5 pb-5">
                <div className="grid gap-6 md:grid-cols-2">
                  {posts.map((p) => (
                    <PostCard
                      key={p._id}
                      title={p.title}
                      slug={p.slug}
                      excerpt={p.excerpt}
                      coverImage={p.coverImage}
                      publishedAt={p.publishedAt}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
