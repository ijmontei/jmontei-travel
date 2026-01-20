import { sanityClient } from "@/lib/sanity.client";
import { POSTS_QUERY } from "@/lib/sanity.queries";
import type { Post } from "@/lib/types";
import { HomeView } from "@/components/HomeView";

export default async function HomePage() {
  const posts = await sanityClient.fetch<Post[]>(POSTS_QUERY);
  return <HomeView posts={posts} />;
}