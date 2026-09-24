import { ArrowDown, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { RevealLines, RevealText } from "@/components/ui/RevealText";
import { SectionEyebrow } from "@/components/ui/SectionEyebrow";
import { SectionDivider } from "@/components/ui/SectionDivider";
import { ScrollLinkButton } from "@/components/ui/ScrollLinkButton";
import { SamuraiEmblem } from "@/components/sections/SamuraiEmblem";
import { site } from "@/lib/data/site";

export function Hero() {
  return (
    <div className="relative">
      <section
        id="top"
        aria-label="Introduction"
        className="relative grain-overlay overflow-hidden bg-acid pb-24 pt-28 sm:pt-32 md:pb-32"
      >
        <div className="mx-auto grid max-w-[1600px] grid-cols-1 items-start gap-10 px-6 sm:px-10 lg:grid-cols-12 lg:gap-8 lg:px-16">
          <div className="lg:col-span-8">
            <SectionEyebrow className="mb-6 text-ink">
              SYS.00 — {site.name.toUpperCase()}
            </SectionEyebrow>

            <RevealLines
              lines={site.heroHeadline}
              as="h1"
              trigger="mount"
              lineClassName="font-display text-ink text-[13vw] leading-[0.86] tracking-tight sm:text-[9vw] lg:text-[6.4vw]"
            />

            <div className="mt-10 flex max-w-lg items-start gap-3 lg:mt-14">
              <ArrowUpRight className="mt-1 h-5 w-5 shrink-0 text-ink" aria-hidden />
              <RevealText
                text={site.heroSubhead}
                as="p"
                trigger="mount"
                delay={0.4}
                stagger={0.012}
                className="font-mono text-xs uppercase leading-relaxed tracking-widest text-ink/80 sm:text-sm"
              />
            </div>

            <div className="mt-12 flex flex-wrap items-center gap-4 lg:mt-16">
              <ScrollLinkButton
                target="work"
                className="border-2 border-ink bg-ink px-7 py-4 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-acid transition-colors hover:bg-transparent hover:text-ink"
              >
                See the work
              </ScrollLinkButton>
              <Link
                href="/studio"
                className="border-2 border-ink px-7 py-4 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-ink transition-colors hover:bg-ink hover:text-acid"
              >
                Open Studio
              </Link>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink/70">
                {site.founder}
                <span className="block text-ink/50">Founder &amp; Lead Engineer</span>
              </p>
            </div>
          </div>

          <div className="relative z-10 mx-auto w-full max-w-[280px] sm:max-w-[320px] lg:col-span-4 lg:mx-0 lg:mt-4 lg:max-w-none lg:justify-self-end">
            <SamuraiEmblem className="w-full max-w-[360px] lg:ml-auto" />
          </div>
        </div>

        <div
          aria-hidden
          className="mt-14 hidden items-center justify-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-ink/60 sm:flex"
        >
          <span>Scroll</span>
          <ArrowDown className="h-3 w-3 animate-bounce motion-reduce:animate-none" />
        </div>
      </section>

      <SectionDivider from="var(--color-acid)" to="var(--color-ink)" />
    </div>
  );
}
