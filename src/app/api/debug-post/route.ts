import { NextResponse } from "next/server";
import { sanityClient } from "@/lib/sanity.client";
import { POST_BY_SLUG_QUERY } from "@/lib/sanity.queries";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const slug = url.searchParams.get("slug");

  const env = {
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  };

  if (!slug) {
    return NextResponse.json({ ok: false, error: "Missing slug", env }, { status: 400 });
  }

  const post = await sanityClient.fetch(POST_BY_SLUG_QUERY, { slug });

  return NextResponse.json({
    ok: true,
    env,
    slug,
    found: !!post,
    title: post?.title ?? null,
    id: post?._id ?? null,
  });
}
