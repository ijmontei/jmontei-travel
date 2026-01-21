import { sanityClient } from "@/lib/sanity.client";

type FetchParams = Record<string, any>;

export async function sanityFetch<T>(
  query: string,
  params: FetchParams = {},
  tags: string[] = ["posts"]
): Promise<T> {
  return sanityClient.fetch<T>(
    query,
    params,
    {
      next: { tags },
    } as any
  );
}
