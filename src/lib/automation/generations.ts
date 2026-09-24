import { getSql } from "@/lib/db";
import type { AutomationWorkflow } from "@/types";

export interface GenerationSummary {
  id: string;
  prompt: string;
  title: string | null;
  category: string | null;
  mode: string;
  model: string | null;
  createdAt: string;
}

export async function recordGeneration(workflow: AutomationWorkflow): Promise<void> {
  const sql = getSql();
  if (!sql) return;
  try {
    await sql`
      INSERT INTO automation_workflows (id, prompt, title, category, workflow, mode, model)
      VALUES (
        ${workflow.id},
        ${workflow.prompt.slice(0, 2000)},
        ${workflow.title},
        ${workflow.category},
        ${JSON.stringify(workflow)}::jsonb,
        ${workflow.mode},
        ${workflow.model ?? null}
      )
      ON CONFLICT (id) DO NOTHING
    `;
  } catch (error) {
    console.error("[generations] record failed:", error);
  }
}

export async function listGenerations(limit = 50): Promise<GenerationSummary[]> {
  const sql = getSql();
  if (!sql) return [];
  const rows = await sql`
    SELECT id, prompt, title, category, mode, model, created_at
    FROM automation_workflows
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;
  return rows.map((row) => {
    const g = row as {
      id: string;
      prompt: string;
      title: string | null;
      category: string | null;
      mode: string;
      model: string | null;
      created_at: string;
    };
    return {
      id: g.id,
      prompt: g.prompt,
      title: g.title,
      category: g.category,
      mode: g.mode,
      model: g.model,
      createdAt: new Date(g.created_at).toISOString(),
    };
  });
}

export async function getGeneration(id: string): Promise<AutomationWorkflow | null> {
  const sql = getSql();
  if (!sql) return null;
  const rows = await sql`SELECT workflow FROM automation_workflows WHERE id = ${id} LIMIT 1`;
  return ((rows[0] as { workflow?: AutomationWorkflow } | undefined)?.workflow) ?? null;
}

export async function deleteGeneration(id: string): Promise<void> {
  const sql = getSql();
  if (!sql) return;
  await sql`DELETE FROM automation_workflows WHERE id = ${id}`;
}

export async function clearGenerations(): Promise<number> {
  const sql = getSql();
  if (!sql) return 0;
  const rows = await sql`DELETE FROM automation_workflows RETURNING id`;
  return rows.length;
}

export async function getGenerationStats(): Promise<{ total: number; live: number; last7Days: number }> {
  const sql = getSql();
  if (!sql) return { total: 0, live: 0, last7Days: 0 };
  const rows = await sql`
    SELECT
      count(*)::int AS total,
      count(*) FILTER (WHERE mode = 'live')::int AS live,
      count(*) FILTER (WHERE created_at > now() - interval '7 days')::int AS last7
    FROM automation_workflows
  `;
  const row = rows[0] as { total: number; live: number; last7: number };
  return { total: row.total, live: row.live, last7Days: row.last7 };
}
