import { RevealLines, RevealText } from "@/components/ui/RevealText";
import { SectionEyebrow } from "@/components/ui/SectionEyebrow";
import { CopyEmailButton } from "@/components/ui/CopyEmailButton";
import { socials } from "@/lib/data/socials";
import { site } from "@/lib/data/site";

export function Contact() {
  return (
    <section
      id="contact"
      aria-labelledby="contact-heading"
      className="grain-overlay bg-ink py-28 text-paper sm:py-36"
    >
      <div className="mx-auto max-w-[1600px] px-6 sm:px-10 lg:px-16">
        <SectionEyebrow className="mb-6 text-acid">{site.contactEyebrow}</SectionEyebrow>

        <RevealLines
          lines={site.contactHeading}
          as="h2"
          id="contact-heading"
          lineClassName="font-display text-paper text-[13vw] leading-[0.88] sm:text-[8vw] lg:text-[6vw]"
        />

        <RevealText
          text={site.contactBody}
          as="p"
          delay={0.35}
          className="mt-8 max-w-xl text-lg leading-relaxed text-paper/70"
        />

        <div className="mt-12 flex flex-col gap-4 sm:flex-row sm:items-center">
          <CopyEmailButton email={site.email} />
          <a
            href={`mailto:${site.email}`}
            className="font-mono text-xs uppercase tracking-widest text-paper/50 underline-offset-4 hover:text-acid hover:underline"
          >
            or open your mail app
          </a>
        </div>

        <ul className="mt-16 flex flex-wrap gap-x-8 gap-y-4 border-t-2 border-paper/10 pt-8">
          {socials.map((social) => {
            const Icon = social.icon;
            const isExternal = social.href.startsWith("http");
            return (
              <li key={social.id}>
                <a
                  href={social.href}
                  target={isExternal ? "_blank" : undefined}
                  rel={isExternal ? "noopener noreferrer" : undefined}
                  className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-paper/70 hover:text-acid"
                >
                  <Icon className="h-4 w-4" aria-hidden />
                  {social.platform}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
