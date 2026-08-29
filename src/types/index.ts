import type { LucideIcon } from "lucide-react";

export interface Discipline {
  id: string;
  label: string;
}

export interface Service {
  id: string;
  index: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

export type ProjectCategory = "Mobile" | "Web" | "AI & Automation";

export interface Project {
  id: string;
  index: string;
  title: string;
  category: ProjectCategory;
  year: string;
  summary: string;
  tags: string[];
  href?: string;
}

export interface Stat {
  id: string;
  value: string;
  label: string;
}

export type SocialPlatform = "GitHub" | "LinkedIn" | "X" | "Instagram" | "Email";

export interface SocialLink {
  id: string;
  platform: SocialPlatform;
  href: string;
  icon: LucideIcon;
}

export interface AiLabLine {
  type: "prompt" | "output";
  text: string;
}

export interface AiLabScenario {
  id: string;
  title: string;
  lines: AiLabLine[];
}
