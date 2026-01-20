import Image from "next/image";
import { urlForImage } from "@/lib/sanity.image";
import Link from "next/link";

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
    ? urlForImage(coverImage).width(1200).height(700).fit("crop").url()
    : null;

  return (
    <Link href={`/posts/${slug}`} className="block group">
      <div className="rounded-2xl border overflow-hidden bg-white transition-all duration-300
                      hover:-translate-y-1 hover:shadow-xl">

        {imageUrl && (
          <div className="relative aspect-[16/9] overflow-hidden">
            <Image
              src={imageUrl}
              alt={title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
              sizes="(max-width: 768px) 100vw, 768px"
            />

            {/* soft gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent
                            opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </div>
        )}

        <div className="p-6">
          <div className="flex flex-wrap gap-x-3 gap-y-1 items-center text-xs text-zinc-500">
            {country && (
              <span className="rounded-full bg-amber-50 text-amber-800 px-2 py-0.5 border border-amber-200">
                {country}
              </span>
            )}
            {publishedAt && <span>{new Date(publishedAt).toLocaleDateString()}</span>}
          </div>

          <h3 className="mt-3 text-lg font-semibold tracking-tight relative inline-block">
            <span className="bg-gradient-to-r from-amber-200/0 to-amber-200/0
                            group-hover:from-amber-200/40 group-hover:to-amber-200/40
                            transition-all duration-300 bg-[length:100%_0.35em] bg-no-repeat bg-bottom">
              {title}
            </span>
          </h3>

          {excerpt && (
            <p className="mt-2 text-sm text-zinc-600 leading-relaxed">
              {excerpt}
            </p>
          )}

          <div className="mt-4 flex items-center gap-2 text-sm font-medium text-amber-700">
            <span>Read</span>
            <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
          </div>
        </div>
      </div>
    </Link>

  );
}
