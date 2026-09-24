import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
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

  const content = await getSiteContent();

  return (
    <main className="min-h-screen bg-paper text-ink">
      <AdminDashboard initialContent={content} username={session.username} />
    </main>
  );
}
