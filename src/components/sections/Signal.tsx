import { ArrowRight } from "lucide-react";
import { SectionEyebrow } from "@/components/ui/SectionEyebrow";
import { RevealLines, RevealText } from "@/components/ui/RevealText";
import { ScrollLinkButton } from "@/components/ui/ScrollLinkButton";

const offers = [
  {
    index: "01",
    title: "The site",
    body: "A site that takes the enquiry, the booking, or the sale. Built as the front door of the system, not a brochure that sits apart from it.",
  },
  {
    index: "02",
    title: "The feed",
    body: "Social that stays on. We write, design, and schedule so the channels sound like the product — the same voice as the site, every week.",
  },
  {
    index: "03",
    title: "The sync",
    body: "Forms, inbox, content, and campaigns wired together. The copy-paste between apps becomes a workflow that runs while you do the actual work.",
  },
];

const chain = ["Arrive", "Land", "Capture", "Publish", "Reply"];

const reasons = [
  {
    title: "A department, without the headcount",
    body: "Site, socials, and the plumbing between them are one engagement. You brief a studio, not a stack of vendors.",
  },
  {
    title: "One voice, everywhere",
    body: "The homepage and the feed stop contradicting each other, because the same system writes both.",
  },
  {
    title: "Leads don't die in an inbox",
    body: "A form submit, a new post, and a follow-up are steps in one workflow — not three apps nobody opens.",
  },
  {
    title: "It keeps moving when you're busy",
    body: "Scheduling, handoffs, and reminders run on their own. Marketing doesn't pause because the week got full.",
  },
];

export function Signal() {
  return (
    <section id="signal" aria-labelledby="signal-heading" className="bg-ink py-24 text-paper sm:py-32">
      <div className="mx-auto max-w-[1600px] px-6 sm:px-10 lg:px-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-end">
          <div>
            <SectionEyebrow className="mb-6 text-acid">LOG.06 — SIGNAL DESK</SectionEyebrow>
            <RevealLines
              lines={["NO IT", "DEPARTMENT", "REQUIRED."]}
              as="h2"
              id="signal-heading"
              lineClassName="font-display text-paper text-[13vw] leading-[0.88] sm:text-[7vw] lg:text-[4.6vw]"
            />
          </div>
          <RevealText
            text="You don't need to hire an IT team to get found. KiragamiKorp builds the website, runs the social channels, and connects the tools so a visitor, a post, and a follow-up are the same system."
            as="p"
            delay={0.2}
            className="max-w-md text-lg leading-relaxed text-paper/70 lg:pb-2"
          />
        </div>

        <ol className="mt-16 grid gap-px border-2 border-paper bg-paper sm:grid-cols-3">
          {offers.map((offer) => (
            <li key={offer.index} className="bg-ink p-6 sm:p-8">
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-acid">{offer.index}</p>
              <h3 className="mt-4 font-display text-4xl uppercase leading-none tracking-tight sm:text-5xl">
                {offer.title}
              </h3>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-paper/65">{offer.body}</p>
            </li>
          ))}
        </ol>

        <div className="mt-px border-2 border-paper">
          <p className="border-b-2 border-paper px-6 py-4 font-mono text-[10px] uppercase tracking-[0.28em] text-acid sm:px-8">
            One chain. Nothing copied by hand.
          </p>
          <ol className="grid sm:grid-cols-5">
            {chain.map((step, index) => (
              <li
                key={step}
                className="flex items-center justify-between gap-4 border-paper px-6 py-5 sm:flex-col sm:items-start sm:border-r-2 sm:px-6 sm:py-8 sm:last:border-r-0 max-sm:border-b-2 max-sm:last:border-b-0"
              >
                <span className="font-mono text-[10px] text-paper/40">{String(index + 1).padStart(2, "0")}</span>
                <span className="font-display text-3xl uppercase leading-none tracking-tight">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-16 grid gap-12 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] lg:gap-16">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-paper/45">Why it beats a department</p>
            <p className="mt-4 font-display text-4xl uppercase leading-[0.9] tracking-tight sm:text-5xl">
              The output of a team. The overhead of a retainer.
            </p>
          </div>
          <ul className="grid gap-6 sm:grid-cols-2">
            {reasons.map((reason) => (
              <li key={reason.title} className="border-l-4 border-acid pl-4">
                <h3 className="font-mono text-xs uppercase tracking-[0.16em] text-paper">{reason.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-paper/60">{reason.body}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-16 flex flex-wrap items-center gap-4">
          <ScrollLinkButton
            target="contact"
            className="inline-flex items-center gap-3 border-2 border-acid bg-acid px-7 py-4 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-ink transition-colors hover:bg-transparent hover:text-acid"
          >
            Brief the studio
            <ArrowRight className="h-4 w-4" aria-hidden />
          </ScrollLinkButton>
          <a
            href="#services"
            className="border-2 border-paper/30 px-7 py-4 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-paper transition-colors hover:border-acid hover:text-acid"
          >
            All services
          </a>
        </div>
      </div>
    </section>
  );
}
