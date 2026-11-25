import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const PLACEHOLDER_IDS = ["orbit", "ledgerline", "autopilot-ops", "fieldnote", "signalboard"];

const projects = [
  {
    id: "operations-command-centre",
    title: "OPERATIONS COMMAND CENTRE — CONCEPT",
    category: "Web",
    year: "2026",
    summary:
      "A responsive operations dashboard concept that turns live activity, priorities and performance data into one clear control surface.",
    tags: ["Next.js", "TypeScript", "Data Visualisation", "Responsive UI"],
    role: "Product strategy, UI/UX design & frontend concept",
    description:
      "Capability concept — not commissioned client work.\n\nThe Operations Command Centre explores how a growing organisation can replace fragmented spreadsheets, chat updates and disconnected reports with one focused web platform. The experience is designed around the decisions operators make every day: what needs attention, what is falling behind and where the team should act next.\n\nThe interface combines status summaries, searchable work queues, trend views and role-aware actions without turning the screen into a wall of charts. Responsive layouts keep the same hierarchy useful from an office monitor to a manager's phone.\n\nThe concept demonstrates KiragamiKorp's approach to complex web products: map the real workflow first, reduce noise, establish a reusable design system and then build the interface as a dependable operational tool.",
  },
  {
    id: "service-booking-experience",
    title: "SERVICE BOOKING EXPERIENCE — CONCEPT",
    category: "Web",
    year: "2026",
    summary:
      "An end-to-end UI/UX concept that makes discovering, comparing and booking professional services feel clear and trustworthy.",
    tags: ["UI/UX", "User Flows", "Design System", "Accessibility"],
    role: "UX research, interaction design & interface system",
    description:
      "Capability concept — not commissioned client work.\n\nThis booking experience begins with the questions customers actually ask: what is included, how much will it cost, when is someone available and what happens after payment? The flow organises those decisions into a short path from service discovery to confirmation.\n\nThe work covers information architecture, primary and edge-case user flows, low-fidelity wireframes, responsive interface states and a reusable component system. Accessible contrast, clear validation, visible progress and plain-language error states are treated as part of the product rather than final polish.\n\nThe concept shows how KiragamiKorp turns an ambiguous service journey into a coherent digital experience that can reduce abandoned enquiries, set expectations early and give a business a consistent foundation for future features.",
  },
  {
    id: "field-operations-companion",
    title: "FIELD OPERATIONS COMPANION — CONCEPT",
    category: "Mobile",
    year: "2026",
    summary:
      "An offline-first mobile app concept for schedules, site forms, progress evidence and reliable field-to-office handover.",
    tags: ["React Native", "Offline First", "Media Capture", "Sync"],
    role: "Mobile product design, UX architecture & engineering concept",
    description:
      "Capability concept — not commissioned client work.\n\nThe Field Operations Companion is designed for teams that work where connectivity is unreliable but reporting still matters. A worker can see assigned visits, complete structured forms, capture photographs and notes, and submit progress without depending on a constant connection.\n\nLocal drafts, visible sync states and conflict-aware updates protect work when the network disappears. The mobile experience favours large touch targets, short forms and clear task status, while the office-facing data model keeps every submission attributable and ready for review.\n\nThe concept demonstrates the product and engineering decisions behind a resilient mobile system: define the field workflow, design offline behaviour deliberately, compress media responsibly and make recovery understandable instead of hiding it.",
  },
  {
    id: "reines-group",
    title: "REINES GROUP",
    category: "Web",
    year: "2026",
    summary:
      "A deployed corporate platform presenting Reines Group's property, construction and manufacturing capability across Malawi.",
    tags: ["Next.js", "React", "TypeScript", "Responsive Web", "SEO"],
    href: "https://www.reines.co.mw",
    role: "Web strategy, UI/UX design & full-stack development",
    description:
      "Client work — live at www.reines.co.mw.\n\nReines Group operates across property development, building and civil contracting, concrete products and dry-mix construction materials. The website had to explain that connected value chain without making a broad organisation feel fragmented.\n\nI designed and built the platform with Next.js, React and TypeScript. The content architecture moves from the company's positioning into clear service lines, featured developments and proof of operational scale. Project showcases give Reines a visual way to document work such as the Chileka Townhouses, while dedicated service and company pages give prospective clients enough detail to understand the offer before making contact.\n\nThe responsive system carries a consistent visual language across desktop and mobile, with reusable components for services, projects, values, statistics and calls to action. Search and sharing metadata, an Open Graph image, semantic page structure and direct contact routes help the site work as both a corporate profile and a lead-generation channel.\n\nThe wider product also introduces Reines Project Mate: a secure client portal concept for live project status, progress photography, milestone and cost tracking, and direct communication with a project manager. Together, the public website and portal direction turn Reines' digital presence into an operating layer rather than a static brochure.",
  },
];

function databaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const line = readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .find((entry) => entry.startsWith("DATABASE_URL="));
  if (!line) throw new Error("DATABASE_URL is not configured.");
  return line.slice("DATABASE_URL=".length).trim().replace(/^["']|["']$/g, "");
}

async function main() {
  const sql = neon(databaseUrl());
  const rows = await sql`SELECT id FROM projects ORDER BY id`;
  const ids = rows.map((row) => row.id);
  const unexpected = ids.filter((id) => !PLACEHOLDER_IDS.includes(id));
  const missing = PLACEHOLDER_IDS.filter((id) => !ids.includes(id));

  if (unexpected.length || missing.length || ids.length !== PLACEHOLDER_IDS.length) {
    throw new Error(
      `Refusing to migrate: expected only ${PLACEHOLDER_IDS.join(", ")}; found ${ids.join(", ") || "no projects"}.`,
    );
  }

  await sql.transaction([
    sql`DELETE FROM projects WHERE id = ANY(${PLACEHOLDER_IDS})`,
    ...projects.map(
      (project, index) => sql`
        INSERT INTO projects (
          id, index_label, title, category, year, summary, tags, href,
          description, role, images, videos, ai_analysis, published, sort_order, updated_at
        )
        VALUES (
          ${project.id}, ${String(index + 1).padStart(2, "0")}, ${project.title},
          ${project.category}, ${project.year}, ${project.summary},
          ${JSON.stringify(project.tags)}::jsonb, ${project.href ?? null},
          ${project.description}, ${project.role}, '[]'::jsonb, '[]'::jsonb,
          NULL, true, ${index}, now()
        )
      `,
    ),
    sql`
      UPDATE site_content
      SET projects = ${JSON.stringify(
        projects.map((project, index) => ({
          ...project,
          index: String(index + 1).padStart(2, "0"),
          images: [],
          videos: [],
          published: true,
        })),
      )}::jsonb,
      updated_at = now()
      WHERE id = 'default'
    `,
  ]);

  const result = await sql`
    SELECT id, title, published, sort_order
    FROM projects
    ORDER BY sort_order
  `;
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
