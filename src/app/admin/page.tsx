import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdminSession } from "@/lib/admin/auth";
import { getSiteContent } from "@/lib/content/store";

export const metadata: Metadata = {
  title: "Ops Deck",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const session = await requireAdminSession();
  if (!session) {
    redirect("/");
  }

  const content = await getSiteContent({ includeDrafts: true });

  return (
    <AdminShell
      initialContent={content}
      username={session.username}
      displayName={session.displayName}
      hasDatabaseAdmin={session.adminUserId !== null}
    />
  );
}
