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
    ? urlForImage(coverImage).width(1200).height(700).fit("crop").auto("format").url()
    : null;

  return (
    <Link href={`/posts/${slug}`} className="block group">
      <div className="rounded-2xl border overflow-hidden bg-zinc-50">
        {imageUrl && (
          <div className="relative aspect-[16/9]">
            <Image
              src={imageUrl}
              alt={title}
              fill
              className="object-cover group-hover:scale-[1.01] transition"
              sizes="(max-width: 768px) 100vw, 768px"
            />
          </div>
        )}

        <div className="p-6">
          <div className="flex flex-wrap gap-x-3 gap-y-1 items-center text-xs text-zinc-500">
            {country && <span className="rounded-full bg-white px-2 py-1 border">{country}</span>}
            {publishedAt && <span>{new Date(publishedAt).toLocaleDateString()}</span>}
          </div>

          <h3 className="mt-3 text-lg font-semibold tracking-tight">{title}</h3>
          {excerpt && <p className="mt-2 text-sm text-zinc-600 leading-relaxed">{excerpt}</p>}
        </div>
      </div>
    </Link>
  );
}
