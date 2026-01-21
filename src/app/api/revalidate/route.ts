import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

async function handler(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (!process.env.REVALIDATE_SECRET || secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ ok: false, message: "Invalid secret" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const doc = body?.document || body?.result || body?.payload || body;

  const slug = doc?.slug?.current || doc?.slug || null;

  revalidatePath("/");
  revalidatePath("/post");
  if (slug) revalidatePath(`/post/${slug}`);

  return NextResponse.json({
    ok: true,
    revalidated: slug ? ["/", `/post/${slug}`] : ["/"],
  });
}

export async function POST(req: NextRequest) {
  return handler(req);
}

export async function GET(req: NextRequest) {
  // handy for manual testing
  return handler(req);
}
