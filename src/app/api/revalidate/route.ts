import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

async function handler(req: NextRequest) {
  const secretFromQuery = req.nextUrl.searchParams.get("secret");
  const secretFromHeader = req.headers.get("x-revalidate-secret");
  const secret = secretFromHeader ?? secretFromQuery;

  if (!process.env.REVALIDATE_SECRET || secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ ok: false, message: "Invalid secret" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));

  // Sanity payloads vary depending on webhook config
  const doc = body?.document || body?.result || body?.payload || body;

  const slug =
    doc?.slug?.current ||
    doc?.slug ||
    body?.slug || // if you send { slug: "..." } yourself
    null;

  // Revalidate homepage (latest + itinerary derives from posts)
  revalidatePath("/");

  // Revalidate post detail if we know which one changed
  if (slug) {
    revalidatePath(`/posts/${slug}`);
  }

  return NextResponse.json({
    ok: true,
    revalidated: slug ? ["/", `/posts/${slug}`] : ["/"],
  });
}

export async function POST(req: NextRequest) {
  return handler(req);
}

export async function GET(req: NextRequest) {
  // Handy for manual testing
  return handler(req);
}
