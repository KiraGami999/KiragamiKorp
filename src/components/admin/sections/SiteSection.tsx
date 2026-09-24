"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button, Field, Panel } from "@/components/admin/ui";
import type { Stat } from "@/types";
import type { EditableSite } from "@/types/content";

function toLines(value: string): string[] {
  return value.split("\n").map((line) => line.trim()).filter(Boolean);
}

export function SiteSection({ site, onChange }: { site: EditableSite; onChange: (patch: Partial<EditableSite>) => void }) {
  return (
    <div className="space-y-6">
      <Panel title="Identity" description="Studio name, founder line and the contact inbox.">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Studio name" value={site.name} onChange={(name) => onChange({ name })} />
          <Field label="Founder" value={site.founder} onChange={(founder) => onChange({ founder })} />
          <Field label="Role line" value={site.role} onChange={(role) => onChange({ role })} />
          <Field label="Email" type="email" value={site.email} onChange={(email) => onChange({ email })} />
        </div>
      </Panel>

      <Panel title="Hero" description="The first thing visitors read. Each headline row renders as its own line.">
        <div className="space-y-5">
          <Field
            label="Headline (one line per row)"
            value={site.heroHeadline.join("\n")}
            multiline
            rows={3}
            onChange={(value) => onChange({ heroHeadline: toLines(value) })}
          />
          <Field label="Subhead" value={site.heroSubhead} multiline rows={3} onChange={(heroSubhead) => onChange({ heroSubhead })} />
          <Field
            label="Disciplines (one per row)"
            value={site.disciplines.map((item) => item.label).join("\n")}
            multiline
            rows={4}
            hint="Shown in the scrolling marquee."
            onChange={(value) =>
              onChange({
                disciplines: toLines(value).map((label, index) => ({
                  id: site.disciplines[index]?.id ?? `discipline-${index + 1}`,
                  label,
                })),
              })
            }
          />
        </div>
      </Panel>

      <Panel title="About">
        <div className="space-y-5">
          <Field label="Eyebrow" value={site.aboutEyebrow} onChange={(aboutEyebrow) => onChange({ aboutEyebrow })} />
          <Field
            label="Heading (one line per row)"
            value={site.aboutHeading.join("\n")}
            multiline
            rows={3}
            onChange={(value) => onChange({ aboutHeading: toLines(value) })}
          />
          <Field label="Body" value={site.aboutBody} multiline rows={5} onChange={(aboutBody) => onChange({ aboutBody })} />
          <Field
            label="Philosophy"
            value={site.aboutPhilosophy}
            multiline
            rows={3}
            onChange={(aboutPhilosophy) => onChange({ aboutPhilosophy })}
          />
        </div>
      </Panel>

      <Panel title="Contact">
        <div className="space-y-5">
          <Field label="Eyebrow" value={site.contactEyebrow} onChange={(contactEyebrow) => onChange({ contactEyebrow })} />
          <Field
            label="Heading (one line per row)"
            value={site.contactHeading.join("\n")}
            multiline
            rows={3}
            onChange={(value) => onChange({ contactHeading: toLines(value) })}
          />
          <Field label="Body" value={site.contactBody} multiline rows={4} onChange={(contactBody) => onChange({ contactBody })} />
        </div>
      </Panel>
    </div>
  );
}

export function StatsSection({ stats, onChange }: { stats: Stat[]; onChange: (stats: Stat[]) => void }) {
  return (
    <Panel
      title="Stats"
      description="The numbers strip on the landing page. Rows with an empty value or label are dropped on save."
      actions={
        <Button
          variant="primary"
          disabled={stats.length >= 8}
          onClick={() => onChange([...stats, { id: `stat-${crypto.randomUUID().slice(0, 8)}`, value: "", label: "" }])}
        >
          <Plus className="h-3.5 w-3.5" aria-hidden /> Add stat
        </Button>
      }
    >
      <div className="space-y-4">
        {stats.map((stat, index) => (
          <div key={stat.id} className="grid items-end gap-4 sm:grid-cols-[10rem_minmax(0,1fr)_auto]">
            <Field
              label="Value"
              value={stat.value}
              placeholder="40+"
              onChange={(value) => onChange(stats.map((item, i) => (i === index ? { ...item, value } : item)))}
            />
            <Field
              label="Label"
              value={stat.label}
              placeholder="Products shipped"
              onChange={(label) => onChange(stats.map((item, i) => (i === index ? { ...item, label } : item)))}
            />
            <Button variant="danger" aria-label={`Remove stat ${index + 1}`} onClick={() => onChange(stats.filter((_, i) => i !== index))}>
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
            </Button>
          </div>
        ))}
        {!stats.length ? <p className="text-sm text-ink/55">No stats yet.</p> : null}
      </div>
    </Panel>
  );
}
