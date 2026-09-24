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
}

export interface GenerateAutomationRequest {
  prompt: string;
}

export interface GenerateAutomationResponse {
  workflow: AutomationWorkflow;
}
