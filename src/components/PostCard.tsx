import Link from "next/link";
import Image from "next/image";
import { urlForImage } from "@/lib/sanity.image";

type PostCardProps = {
  title: string;
  slug: string;
  excerpt?: string;
  coverImage?: any;
  publishedAt?: string;
  country?: string;
};

export function PostCard(props: PostCardProps) {
  const { title, slug, excerpt, coverImage, publishedAt, country } = props;

  const imageUrl = coverImage
    ? urlForImage(coverImage).width(1400).height(820).fit("crop").auto("format").url()
    : null;

  return (
    <Link href={`/posts/${slug}`} className="block group">
      <div
        className="
          rounded-2xl border border-[rgb(var(--border))] overflow-hidden
          bg-[rgb(var(--card))] shadow-sm
          transition-all duration-300
          hover:-translate-y-1 hover:shadow-xl
        "
      >
        {imageUrl && (
          <div className="relative aspect-[16/9] overflow-hidden">
            <Image
              src={imageUrl}
              alt={title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
              sizes="(max-width: 768px) 100vw, 768px"
            />

            {/* soft overlay */}
            <div
              className="
                absolute inset-0 opacity-0 group-hover:opacity-100
                transition-opacity duration-500
                bg-gradient-to-t from-black/35 via-black/0 to-black/0
              "
            />
          </div>
        )}

        <div className="p-6">
          <div className="flex flex-wrap gap-x-3 gap-y-2 items-center text-xs text-[rgb(var(--muted))]">
            {country && (
              <span className="rounded-full bg-amber-50 text-amber-800 px-2.5 py-1 border border-amber-200">
                {country}
              </span>
            )}
            {publishedAt && <span>{new Date(publishedAt).toLocaleDateString()}</span>}
          </div>

          <h3 className="mt-3 text-lg font-semibold tracking-tight text-[rgb(var(--text))]">
            <span
              className="
                bg-[linear-gradient(transparent_60%,rgba(180,83,9,0.18)_60%)]
                group-hover:bg-[linear-gradient(transparent_55%,rgba(180,83,9,0.26)_55%)]
                transition
              "
            >
              {title}
            </span>
          </h3>

          {excerpt && (
            <p className="mt-2 text-sm text-zinc-600 leading-relaxed">
              {excerpt}
            </p>
          )}

          <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-amber-700">
            <span>Read</span>
            <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
