import { projects as defaultProjects } from "@/lib/data/projects";
import { site as defaultSite, disciplines as defaultDisciplines } from "@/lib/data/site";
import { stats as defaultStats } from "@/lib/data/stats";
import type { SiteContent } from "@/types/content";

/** Static fallback used when the database is empty or unavailable. */
export function getDefaultContent(): SiteContent {
  return {
    site: {
      name: defaultSite.name,
      founder: defaultSite.founder,
      role: defaultSite.role,
      heroHeadline: [...defaultSite.heroHeadline],
      heroSubhead: defaultSite.heroSubhead,
      aboutEyebrow: defaultSite.aboutEyebrow,
      aboutHeading: [...defaultSite.aboutHeading],
      aboutBody: defaultSite.aboutBody,
      aboutPhilosophy: defaultSite.aboutPhilosophy,
      contactEyebrow: defaultSite.contactEyebrow,
      contactHeading: [...defaultSite.contactHeading],
      contactBody: defaultSite.contactBody,
      email: defaultSite.email,
      disciplines: defaultDisciplines.map((d) => ({ ...d })),
    },
    projects: defaultProjects.map((p) => ({ ...p, tags: [...p.tags] })),
    stats: defaultStats.map((s) => ({ ...s })),
  };
}
