import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { sanityClient } from "@/lib/sanity.client";
import { urlForImage } from "@/lib/sanity.image";
import { PortableTextRenderer } from "@/components/PortableTextRenderer";
import { GalleryCarousel } from "@/components/GalleryCarousel";

type PageProps = {
  params: Promise<{ slug: string }>;
};

// Keep these types lightweight and permissive so the page doesn't break
type Accommodation = {
  name?: string;
  type?: string;
  address?: string;
  link?: string;
  notes?: string;
};

type Activity = {
  title?: string;
  timeOfDay?: string; // "Morning" | "Afternoon" | "Evening" | etc.
  category?: string;
  link?: string;
  notes?: string;
};

type Post = {
  _id: string;
  title: string;
  slug: string;
  publishedAt?: string;
  excerpt?: string;
  coverImage?: any;
  country?: string;
  city?: string;
  accommodation?: Accommodation;
  activities?: Activity[];
  body?: any;
  gallery?: any[];
};

const POST_BY_SLUG_QUERY = /* groq */ `
*[_type == "post" && slug.current == $slug][0]{
  _id,
  title,
  "slug": slug.current,
  publishedAt,
  excerpt,
  coverImage,
  country,
  city,
  accommodation{
    name,
    type,
    address,
    link,
    notes
  },
  activities[]{
    title,
    timeOfDay,
    category,
    link,
    notes
  },
  body,
  gallery
}
`;

function formatDate(d?: string) {
  if (!d) return null;
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function cleanLabel(parts: Array<string | undefined | null>) {
  return parts.filter(Boolean).join(" · ");
}

export default async function PostPage({ params }: PageProps) {
  const { slug } = await params;
  if (!slug) notFound();

  const post = (await sanityClient.fetch(POST_BY_SLUG_QUERY, { slug })) as Post | null;
  if (!post) notFound();

  const coverUrl = post.coverImage
    ? urlForImage(post.coverImage)
        .width(1800)
        .height(900)
        .fit("crop")
        .auto("format")
        .url()
    : null;

  const metaLine = cleanLabel([
    post.country,
    post.city,
    formatDate(post.publishedAt) ?? undefined,
  ]);

  const hasItineraryDetails =
    Boolean(post.city) ||
    Boolean(post.accommodation?.name) ||
    Boolean(post.activities?.length);

  return (
    <article className="max-w-3xl">
      <div className="mb-6">
        <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-800">
          ← Back
        </Link>

        {metaLine ? <div className="mt-3 text-sm text-zinc-500">{metaLine}</div> : null}

        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{post.title}</h1>

        {post.excerpt ? (
          <p className="mt-3 text-zinc-600 leading-relaxed">{post.excerpt}</p>
        ) : null}
      </div>

      {coverUrl ? (
        <div className="mb-8 overflow-hidden rounded-2xl border bg-zinc-50">
          <div className="relative aspect-[16/9]">
            <Image src={coverUrl} alt={post.title} fill className="object-cover" sizes="100vw" />
          </div>
        </div>
      ) : null}

      <PortableTextRenderer value={post.body} />
      {hasItineraryDetails ? (  
        <section className="mb-8 rounded-2xl border bg-white p-4 sm:p-5">
            {}
            {post.accommodation?.name ? (
              <div className="rounded-xl bg-zinc-50 p-3">
                <div className="text-xs font-semibold text-zinc-500">ACCOMMODATION</div>
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                  <div className="font-medium text-zinc-900">{post.accommodation.name}</div>
                  {post.accommodation.type ? (
                    <span className="text-xs rounded-full border bg-white px-2 py-0.5 text-zinc-600">
                      {post.accommodation.type}
                    </span>
                  ) : null}
                </div>

                {post.accommodation.link ? (
                  <div className="mt-2">
                    <a
                      href={post.accommodation.link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-zinc-700 underline underline-offset-4 hover:text-zinc-900"
                    >
                      View site ↗
                    </a>
                  </div>
                ) : null}
              </div>
            ) : null}
        </section>
      ) : null} 
      {/* Carousel gallery (no cropping, preserves aspect ratio) */}
      {post.gallery?.length ? <GalleryCarousel images={post.gallery} /> : null}
    </article>
  );
}
