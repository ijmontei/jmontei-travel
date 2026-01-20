import { sanityClient } from "@/lib/sanity.client";
import { POSTS_BY_TRIP_QUERY } from "@/lib/sanity.queries";
import { PostCard } from "@/components/PostCard";

export default async function TripDetailPage({ params }: { params: { slug: string } }) {
  const posts = await sanityClient.fetch(POSTS_BY_TRIP_QUERY, { tripSlug: params.slug });

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">Trip</h1>
      <p className="mt-2 text-zinc-600">Posts in this trip.</p>

      <div className="mt-8 grid gap-6">
        {posts?.map((p: any) => (
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
  );
}
