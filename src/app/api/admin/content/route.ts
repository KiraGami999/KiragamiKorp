import { NextResponse } from "next/server";
import { guardAdmin, readJson } from "@/lib/admin/api";
import { logAudit } from "@/lib/admin/audit";
import { getClientKey } from "@/lib/automation/rate-limit";
import { getSiteContent, saveSiteContent } from "@/lib/content/store";
import type { SiteContent } from "@/types/content";

export const runtime = "nodejs";

export async function GET() {
  const guard = await guardAdmin();
  if (guard.response) return guard.response;

  const content = await getSiteContent({ includeDrafts: true });
  return NextResponse.json({ content });
}

export async function PUT(request: Request) {
  const guard = await guardAdmin();
  if (guard.response) return guard.response;

  const body = await readJson<{ content?: SiteContent }>(request);
  if (!body?.content) {
    return NextResponse.json({ error: "Content is required." }, { status: 400 });
  }

  try {
    const content = await saveSiteContent(body.content);
    await logAudit(
      "content_saved",
      {
        projects: content.projects.length,
        drafts: content.projects.filter((project) => project.published === false).length,
      },
      getClientKey(request),
    );
    return NextResponse.json({ content });
  } catch (error) {
    console.error("[admin/content] save failed:", error);
    const message = error instanceof Error ? error.message : "Save failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
