import { readFileSync } from "node:fs";
import { randomBytes, scryptSync } from "node:crypto";
import { neon } from "@neondatabase/serverless";

function loadEnvLocal() {
  const env = readFileSync(".env.local", "utf8");
  const line = env.split(/\r?\n/).find((entry) => entry.startsWith("DATABASE_URL="));
  if (!line) throw new Error("DATABASE_URL missing from .env.local");
  return line.slice("DATABASE_URL=".length).trim();
}

function hash(value) {
  const salt = randomBytes(16);
  const digest = scryptSync(value, salt, 64);
  return `scrypt:${salt.toString("hex")}:${digest.toString("hex")}`;
}

const site = {
  name: "KiragamiKorp",
  founder: "Blessings Mandala",
  role: "Digital Engineering & AI Studio",
  heroHeadline: ["ENGINEERING", "DIGITAL MAGIC", "THROUGH CODE,", "AI & DESIGN."],
  heroSubhead:
    "KiragamiKorp is the digital engineering studio of Blessings Mandala — building mobile apps, web platforms, and local AI automation systems that feel like they were shipped from the future.",
  aboutEyebrow: "SYS.01 — FOUNDER",
  aboutHeading: ["BUILT BY", "ONE ENGINEER.", "RUN LIKE A LAB."],
  aboutBody:
    "Blessings Mandala is a software engineer working across mobile, web, and AI automation — designing systems end-to-end, from architecture to interface to the prompts that make local AI useful. KiragamiKorp is the studio built around that practice: small, precise, and obsessed with craft.",
  aboutPhilosophy:
    "Every product is a system first, an interface second. Good engineering is invisible; good design makes it feel inevitable.",
  contactEyebrow: "LOG.05 — CONTACT",
  contactHeading: ["LET'S BUILD", "SOMETHING THAT", "DOESN'T EXIST YET."],
  contactBody:
    "Open to product builds, automation systems, and studio collaborations. Reach out and describe what you're building.",
  email: "hello@kiragamikorp.com",
  disciplines: [
    { id: "mobile", label: "Mobile App Development" },
    { id: "web", label: "Web Application Development" },
    { id: "ai", label: "Local AI & Automation" },
    { id: "prompt", label: "Prompt Engineering" },
    { id: "architecture", label: "Software Architecture" },
    { id: "creative", label: "Creative Digital Experiences" },
  ],
};

const projects = [
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

const stats = [
  { id: "years", value: "5+", label: "Years Engineering" },
  { id: "disciplines", value: "6", label: "Core Disciplines" },
  { id: "shipped", value: "20+", label: "Systems Shipped" },
  { id: "automation", value: "500+", label: "Hours Automated" },
];

async function main() {
  const sql = neon(loadEnvLocal());
  const passHash = hash("Kiragami@90210");
  const gateHash = hash("Screw Arasaka");

  await sql`DELETE FROM admin_sessions`;
  await sql`DELETE FROM admin_users`;

  await sql`
    INSERT INTO admin_users (username, password_hash, display_name)
    VALUES (${"KiragamiKorp"}, ${passHash}, ${"Blessings Mandala"})
  `;

  await sql`
    INSERT INTO auth_config (id, gate_phrase_hash)
    VALUES ('default', ${gateHash})
    ON CONFLICT (id) DO UPDATE SET
      gate_phrase_hash = EXCLUDED.gate_phrase_hash,
      updated_at = now()
  `;

  await sql`
    INSERT INTO site_settings (id, data)
    VALUES ('default', ${JSON.stringify(site)}::jsonb)
    ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()
  `;

  await sql`
    INSERT INTO site_content (id, site, projects, stats)
    VALUES (
      'default',
      ${JSON.stringify(site)}::jsonb,
      ${JSON.stringify(projects)}::jsonb,
      ${JSON.stringify(stats)}::jsonb
    )
    ON CONFLICT (id) DO UPDATE SET
      site = EXCLUDED.site,
      projects = EXCLUDED.projects,
      stats = EXCLUDED.stats,
      updated_at = now()
  `;

  for (let i = 0; i < projects.length; i += 1) {
    const project = projects[i];
    await sql`
      INSERT INTO projects (id, index_label, title, category, year, summary, tags, sort_order)
      VALUES (
        ${project.id},
        ${project.index},
        ${project.title},
        ${project.category},
        ${project.year},
        ${project.summary},
        ${JSON.stringify(project.tags)}::jsonb,
        ${i}
      )
      ON CONFLICT (id) DO UPDATE SET
        index_label = EXCLUDED.index_label,
        title = EXCLUDED.title,
        category = EXCLUDED.category,
        year = EXCLUDED.year,
        summary = EXCLUDED.summary,
        tags = EXCLUDED.tags,
        sort_order = EXCLUDED.sort_order,
        updated_at = now()
    `;
  }

  for (let i = 0; i < stats.length; i += 1) {
    const stat = stats[i];
    await sql`
      INSERT INTO site_stats (id, value, label, sort_order)
      VALUES (${stat.id}, ${stat.value}, ${stat.label}, ${i})
      ON CONFLICT (id) DO UPDATE SET
        value = EXCLUDED.value,
        label = EXCLUDED.label,
        sort_order = EXCLUDED.sort_order
    `;
  }

  const tables = await sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
  `;
  const users = await sql`SELECT username, display_name FROM admin_users`;
  console.log(JSON.stringify({ tables: tables.map((row) => row.table_name), users }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
