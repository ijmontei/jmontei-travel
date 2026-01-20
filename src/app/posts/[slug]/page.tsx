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
    return (
      <div style={{ padding: 40 }}>
        ROUTE HIT ✅ slug = {params?.slug}
      </div>
    );
  }
