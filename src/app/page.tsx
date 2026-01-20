import { sanityClient } from "@/lib/sanity.client";
import { POSTS_QUERY } from "@/lib/sanity.queries";
import type { Post } from "@/lib/types";
import { HomeView } from "@/components/HomeView";
import { Hero } from "@/components/Hero";

export default async function HomePage() {
  const posts = await sanityClient.fetch<Post[]>(POSTS_QUERY);
  return <HomeView posts={posts} />;
  return (
    <div className="space-y-10">
      <Hero />

      <div id="posts" className="space-y-6">
        {/* existing posts UI */}
      </div>
    </div>
  );
}