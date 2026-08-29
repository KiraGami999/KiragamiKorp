import type { Project } from "@/types";

/**
 * Placeholder project data. Replace with real case studies — copy the shape
 * of an existing entry and swap in real title/category/summary/tags/href.
 */
export const projects: Project[] = [
  {
    id: "orbit",
    index: "01",
    title: "ORBIT",
    category: "Mobile",
    year: "2025",
    summary:
      "A cross-platform field-operations app with offline-first sync and real-time crew coordination.",
    tags: ["React Native", "Offline Sync", "Realtime"],
  },
  {
    id: "ledgerline",
    index: "02",
    title: "LEDGERLINE",
    category: "Web",
    year: "2025",
    summary:
      "A finance operations dashboard rebuilt from a legacy spreadsheet workflow into a fast, auditable web platform.",
    tags: ["Next.js", "PostgreSQL", "Design System"],
  },
  {
    id: "autopilot-ops",
    index: "03",
    title: "AUTOPILOT OPS",
    category: "AI & Automation",
    year: "2024",
    summary:
      "A local-LLM automation layer that triages inbound support tickets and drafts responses for human review.",
    tags: ["Local LLM", "Prompt Pipelines", "Automation"],
  },
  {
    id: "fieldnote",
    index: "04",
    title: "FIELDNOTE",
    category: "Mobile",
    year: "2024",
    summary:
      "A voice-to-structured-data capture app for on-site inspections, transcribed and organized automatically.",
    tags: ["Swift", "On-device ML", "Speech-to-Text"],
  },
  {
    id: "signalboard",
    index: "05",
    title: "SIGNALBOARD",
    category: "Web",
    year: "2023",
    summary:
      "A real-time analytics dashboard for monitoring distributed systems, built for clarity under alert pressure.",
    tags: ["TypeScript", "WebSockets", "Data Viz"],
  },
];
