import type { MetadataRoute } from "next";
import { getSiteContent } from "@/lib/content/store";

const siteUrl = "https://kiragamikorp.com";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { projects } = await getSiteContent();

  return [
    { url: siteUrl, lastModified: new Date(), changeFrequency: "monthly", priority: 1 },
    { url: `${siteUrl}/studio`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    ...projects.map((project) => ({
      url: `${siteUrl}/work/${project.id}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
