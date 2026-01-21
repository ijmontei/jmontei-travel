import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (!process.env.REVALIDATE_SECRET || secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ ok: false, message: "Invalid secret" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));

  const slug =
    body?.slug?.current ||
    body?.slug ||
    body?.document?.slug?.current ||
    body?.document?.slug ||
    body?.payload?.slug?.current ||
    body?.payload?.slug ||
    null;

  // homepage list depends on posts
  revalidatePath("/");

  // your post page route is /post/[slug] (based on your code)
  if (slug) revalidatePath(`/post/${slug}`);

  return NextResponse.json({
    ok: true,
    revalidated: slug ? ["/", `/post/${slug}`] : ["/"],
  });
}
