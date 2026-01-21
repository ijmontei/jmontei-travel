import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { sanityClient } from "@/lib/sanity.client";
import { urlForImage } from "@/lib/sanity.image";
import { PortableTextRenderer } from "@/components/PortableTextRenderer";
import { GalleryCarousel } from "@/components/GalleryCarousel";

type PageProps = {
  // Your deployment showed params is a Promise — this is the critical fix.
  params: Promise<{ slug: string }>;
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
  body,
  gallery
}
`;

export default async function PostPage({ params }: PageProps) {
  const { slug } = await params;

  if (!slug) notFound();

  const post = await sanityClient.fetch(POST_BY_SLUG_QUERY, { slug });

  if (!post) notFound();

  const coverUrl = post.coverImage
    ? urlForImage(post.coverImage).width(1800).height(900).fit("crop").auto("format").url()
    : null;

  return (
    <article className="max-w-3xl">
      <div className="mb-6">
        <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-800">
          ← Back
        </Link>

        <div className="mt-3 text-sm text-zinc-500">
          {post.country ? <span>{post.country} · </span> : null}
          {post.publishedAt ? (
            <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
          ) : null}
        </div>

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

      {/* Carousel gallery (no cropping, preserves aspect ratio) */}
      {post.gallery?.length ? <GalleryCarousel images={post.gallery} /> : null}
    </article>
  );
}
