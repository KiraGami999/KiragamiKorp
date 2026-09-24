import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin/auth";
import { getSiteContent, normalizeContent, saveSiteContent } from "@/lib/content/store";
import type { SiteContent } from "@/types/content";

export const runtime = "nodejs";

export async function GET() {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const content = await getSiteContent();
  return NextResponse.json({ content });
}

export async function PUT(request: Request) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: { content?: SiteContent };
  try {
    body = (await request.json()) as { content?: SiteContent };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.content) {
    return NextResponse.json({ error: "Content is required." }, { status: 400 });
  }

  try {
    const content = await saveSiteContent(normalizeContent(body.content));
    return NextResponse.json({ content });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Save failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
