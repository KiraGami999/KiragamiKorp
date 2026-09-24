import { RevealLines, RevealText } from "@/components/ui/RevealText";
import { SectionEyebrow } from "@/components/ui/SectionEyebrow";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { GlitchText } from "@/components/ui/GlitchText";
import type { EditableSite } from "@/types/content";
import type { Stat } from "@/types";

export function About({ site, stats }: { site: EditableSite; stats: Stat[] }) {
  return (
    <section id="about" aria-labelledby="about-heading" className="bg-paper py-24 sm:py-32">
      <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-16 px-6 sm:px-10 lg:grid-cols-12 lg:gap-10 lg:px-16">
        <div className="lg:col-span-5">
          <div className="relative flex aspect-[3/4] w-full max-w-sm flex-col justify-between border-2 border-ink bg-ink p-6 text-paper">
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-acid">
              Portrait slot
            </span>
            <GlitchText
              text="BM"
              className="font-display text-[9rem] leading-none text-acid/90 sm:text-[10rem]"
            />
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-paper/50">
              {site.founder} — Founder
            </span>
          </div>
        </div>

        <div className="lg:col-span-7">
          <SectionEyebrow className="mb-6 text-ink/70">{site.aboutEyebrow}</SectionEyebrow>

          <RevealLines
            lines={site.aboutHeading}
            as="h2"
            id="about-heading"
            lineClassName="font-display text-ink text-[11vw] leading-[0.9] tracking-tight sm:text-[6vw] lg:text-[4.2vw]"
          />

          <RevealText
            text={site.aboutBody}
            as="p"
            delay={0.3}
            className="mt-8 max-w-xl text-lg leading-relaxed text-ink/80 sm:text-xl"
          />

          <blockquote className="mt-8 max-w-xl border-l-2 border-acid pl-6 font-mono text-sm uppercase leading-relaxed tracking-wide text-ink/60">
            &ldquo;{site.aboutPhilosophy}&rdquo;
          </blockquote>

          <dl className="mt-14 grid grid-cols-2 gap-8 border-t-2 border-ink/10 pt-10 sm:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.id}>
                <dt className="sr-only">{stat.label}</dt>
                <dd className="font-display text-4xl text-ink sm:text-5xl">
                  <AnimatedCounter value={stat.value} />
                </dd>
                <dd className="mt-2 font-mono text-[11px] uppercase tracking-[0.2em] text-ink/60">
                  {stat.label}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
