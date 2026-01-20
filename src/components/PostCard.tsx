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
    ? urlForImage(coverImage)
        .width(1600)
        .height(900)
        .fit("crop")
        .auto("format")
        .url()
    : null;

  return (
    <Link href={`/posts/${slug}`} className="group block">
      <article
        className={[
          "relative overflow-hidden rounded-3xl border bg-white",
          "border-black/10 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.35)]",
          "transition-all duration-300 ease-out",
          "hover:-translate-y-1 hover:shadow-[0_18px_45px_-22px_rgba(0,0,0,0.45)]",
          "hover:border-black/15",
        ].join(" ")}
      >
        {/* Image (fixed aspect so it never “blows up”) */}
        {imageUrl ? (
          <div className="relative aspect-[16/9] overflow-hidden">
            <Image
              src={imageUrl}
              alt={title}
              fill
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
              priority={false}
            />
            {/* soft overlay */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-black/0 to-black/0 opacity-70 transition-opacity duration-300 group-hover:opacity-90" />
          </div>
        ) : null}

        {/* Content */}
        <div className="p-6">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-zinc-500">
            {country ? (
              <span className="inline-flex items-center rounded-full border border-amber-200/70 bg-amber-50 px-2.5 py-1 text-amber-900">
                {country}
              </span>
            ) : null}

            {publishedAt ? (
              <span className="tabular-nums">
                {new Date(publishedAt).toLocaleDateString()}
              </span>
            ) : null}
          </div>

          <h3 className="mt-3 text-lg font-semibold tracking-tight text-zinc-900">
            <span className="bg-gradient-to-r from-zinc-900 to-zinc-700 bg-[length:0%_2px] bg-left-bottom bg-no-repeat transition-[background-size] duration-300 group-hover:bg-[length:100%_2px]">
              {title}
            </span>
          </h3>

          {excerpt ? (
            <p className="mt-2 text-sm leading-relaxed text-zinc-600">
              {excerpt}
            </p>
          ) : null}

          <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-amber-700">
            Read
            <span className="transition-transform duration-300 group-hover:translate-x-0.5">
              →
            </span>
          </div>
        </div>

        {/* subtle “shine” on hover */}
        <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="absolute -inset-x-24 -inset-y-24 rotate-12 bg-gradient-to-r from-white/0 via-white/25 to-white/0 blur-2xl" />
        </div>
      </article>
    </Link>
  );
}
