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

export interface ProjectImage {
  id: string;
  alt: string;
  width?: number;
  height?: number;
}

/** One episode of a project's teaching series. Only a YouTube reference is stored, never video bytes. */
export interface ProjectVideo {
  id: string;
  /** 11-character YouTube video id. */
  videoId: string;
  title: string;
  /** One-line description shown in the episode list. */
  summary?: string;
  /** Chapter timestamps, links, or a transcript. Plain text, blank lines separate paragraphs. */
  notes?: string;
}

/** The "how AI built this" breakdown shown on a case-study page. Every field is optional. */
export interface AiAnalysis {
  /** The real-world problem and who it is for. */
  problem?: string;
  /** AI tools and models used, e.g. "Cursor", "Claude", "Groq". */
  tools?: string[];
  /** The prompts that worked, one per paragraph. */
  prompts?: string;
  /** Where the AI got it wrong and how it was fixed. */
  mistakes?: string;
  /** What shipped and the result. */
  result?: string;
  /** Short headline number, e.g. "6 hrs → 20 min". */
  metric?: string;
  /** What a learner should take away. */
  takeaway?: string;
}

export interface Project {
  id: string;
  index: string;
  title: string;
  category: ProjectCategory;
  year: string;
  /** Short card copy shown in the Selected Work rail. */
  summary: string;
  /** Technologies / languages. */
  tags: string[];
  /** Live URL. */
  href?: string;
  /** Long-form case study copy; blank lines separate paragraphs. */
  description?: string;
  role?: string;
  repoUrl?: string;
  /** First image is the cover. */
  images?: ProjectImage[];
  /** Teaching series: YouTube episodes, in watch order. */
  videos?: ProjectVideo[];
  /** Structured breakdown of how AI was used to build this. */
  aiAnalysis?: AiAnalysis;
  /** Drafts are saved but hidden from the public site. */
  published?: boolean;
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

export type AutomationStepType =
  | "trigger"
  | "ingest"
  | "transform"
  | "ai"
  | "action"
  | "review";

export interface AutomationStep {
  id: string;
  index: string;
  type: AutomationStepType;
  title: string;
  description: string;
  tool: string;
}

export interface AutomationWorkflow {
  id: string;
  title: string;
  summary: string;
  category: string;
  prompt: string;
  steps: AutomationStep[];
  systemPrompt: string;
  code: {
    language: "python" | "typescript";
    filename: string;
    source: string;
  };
  inputs: string[];
  outputs: string[];
  estimatedTimeSaved: string;
  generatedAt: string;
  mode: "mock" | "live";
  model?: string;
}

export interface GenerateAutomationRequest {
  prompt: string;
}

export interface GenerateAutomationResponse {
  workflow: AutomationWorkflow;
  /** Set when live generation was skipped or failed and the template fallback was used. */
  notice?: string;
}
