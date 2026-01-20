import Image from "next/image";
import { sanityClient } from "@/lib/sanity.client";
import { POST_BY_SLUG_QUERY } from "@/lib/sanity.queries";
import { urlForImage } from "@/lib/sanity.image";

export default async function PostPage({ params }: { params: { slug: string } }) {
  const post = await sanityClient.fetch(POST_BY_SLUG_QUERY, { slug: params.slug });

  if (!post) {
    return (
      <div className="py-16">
        <h1 className="text-2xl font-semibold">Post not found</h1>
      </div>
    );
  }

  const coverUrl = post.coverImage
    ? urlForImage(post.coverImage).width(2000).height(1100).fit("crop").url()
    : null;

  return (
    <article className="mx-auto max-w-3xl px-5 py-10">
      <div className="flex flex-wrap gap-2 text-sm text-[hsl(var(--muted))]">
        {post.country && (
          <span className="rounded-full bg-white/70 px-3 py-1 border border-[hsl(var(--border))]">
            {post.country}
          </span>
        )}
        {post.publishedAt && <span>{new Date(post.publishedAt).toLocaleDateString()}</span>}
      </div>

      <h1 className="mt-4 text-3xl font-semibold tracking-tight">{post.title}</h1>

      {post.excerpt && (
        <p className="mt-3 text-[hsl(var(--muted))] leading-relaxed">{post.excerpt}</p>
      )}

      {coverUrl && (
        <div className="mt-8 relative aspect-[16/9] overflow-hidden rounded-2xl border border-[hsl(var(--border))]">
          <Image src={coverUrl} alt={post.title} fill className="object-cover" sizes="100vw" />
        </div>
      )}

      {/* TODO: render body (Portable Text) */}
    </article>
  );
}
