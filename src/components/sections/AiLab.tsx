import { SectionEyebrow } from "@/components/ui/SectionEyebrow";
import { RevealLines, RevealText } from "@/components/ui/RevealText";
import { AiLabTerminal } from "@/components/sections/AiLabTerminal";
import { aiLabScenarios } from "@/lib/data/ai-lab";

export function AiLab() {
  return (
    <section id="lab" aria-labelledby="lab-heading" className="grain-overlay bg-acid py-24 sm:py-32">
      <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-14 px-6 sm:px-10 lg:grid-cols-12 lg:gap-10 lg:px-16">
        <div className="lg:col-span-5">
          <SectionEyebrow className="mb-4 text-ink/70">LOG.04 — THE LAB</SectionEyebrow>
          <RevealLines
            lines={["AUTOMATION,", "MADE LOCAL."]}
            as="h2"
            id="lab-heading"
            lineClassName="font-display text-ink text-[13vw] leading-[0.9] sm:text-[6vw] lg:text-[3.6vw]"
          />
          <RevealText
            text="A simulated preview of the automation pipelines built for clients — local-first, prompt-engineered, and wired into real workflows. Not a live model call, just a look at the shape of the work."
            as="p"
            delay={0.3}
            className="mt-6 max-w-md text-base leading-relaxed text-ink/75"
          />

          <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.25em] text-ink/50">
            Simulated workflow preview
          </p>

          <ul className="sr-only">
            {aiLabScenarios.map((scenario) => (
              <li key={scenario.id}>
                <p>{scenario.title}</p>
                <ul>
                  {scenario.lines.map((line) => (
                    <li key={line.text}>{line.text}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center lg:col-span-7">
          <AiLabTerminal />
        </div>
      </div>
    </section>
  );
}
