import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { sanityClient } from "@/lib/sanity.client";
import { POST_BY_SLUG_QUERY } from "@/lib/sanity.queries";
import { urlForImage } from "@/lib/sanity.image";
import { PortableTextRenderer } from "@/components/PortableTextRenderer";

type PageProps = {
  params: { slug: string };
};

export default async function PostPage({ params }: PageProps) {
  const slug = params?.slug;

  const post = await sanityClient.fetch(POST_BY_SLUG_QUERY, { slug });

    console.log("POST PAGE DEBUG", { slug, found: !!post });

    if (!post) notFound();
}
