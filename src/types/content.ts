import type { Project, Stat } from "@/types";

export interface EditableSite {
  name: string;
  founder: string;
  role: string;
  heroHeadline: string[];
  heroSubhead: string;
  aboutEyebrow: string;
  aboutHeading: string[];
  aboutBody: string;
  aboutPhilosophy: string;
  contactEyebrow: string;
  contactHeading: string[];
  contactBody: string;
  email: string;
  disciplines: { id: string; label: string }[];
}

export interface SiteContent {
  site: EditableSite;
  projects: Project[];
  stats: Stat[];
}

export interface SiteContentRecord extends SiteContent {
  updatedAt: string;
}
