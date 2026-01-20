import { sanityClient } from "@/lib/sanity.client";
import { POSTS_QUERY } from "@/lib/sanity.queries";
import { PostCard } from "@/components/PostCard";

export default async function HomePage() {
  const posts = await sanityClient.fetch(POSTS_QUERY);

  return (
    <div>
      <section className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight">Travel journal</h1>
        <p className="mt-2 text-zinc-600">
          Posts and photos from the road.
        </p>
      </section>

      <section className="grid gap-6">
        {posts?.map((p: any) => (
          <PostCard
            key={p._id}
            title={p.title}
            slug={p.slug}
            excerpt={p.excerpt}
            coverImage={p.coverImage}
            publishedAt={p.publishedAt}
            tripTitle={p.trip?.title}
          />
        ))}
      </section>
    </div>
  );
}
