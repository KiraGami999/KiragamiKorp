import { ArrowUp } from "lucide-react";
import { site } from "@/lib/data/site";

const sitemap = [
  { href: "#work", label: "Work" },
  { href: "#services", label: "Services" },
  { href: "#lab", label: "Lab" },
  { href: "#about", label: "About" },
  { href: "#contact", label: "Contact" },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t-2 border-acid bg-ink py-10 text-paper">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-8 px-6 sm:px-10 lg:flex-row lg:items-center lg:justify-between lg:px-16">
        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-6 gap-y-2 font-mono text-xs uppercase tracking-[0.2em] text-paper/60">
            {sitemap.map((link) => (
              <li key={link.href}>
                <a href={link.href} className="hover:text-acid">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <p className="max-w-md font-mono text-[11px] uppercase leading-relaxed tracking-[0.15em] text-paper/40">
          © {year} {site.name}. Engineered with Next.js, TypeScript, Tailwind CSS, GSAP &amp; Framer
          Motion.
        </p>

        <a
          href="#top"
          className="flex items-center gap-2 self-start font-mono text-xs uppercase tracking-[0.2em] text-paper/60 hover:text-acid lg:self-auto"
        >
          Back to top
          <ArrowUp className="h-4 w-4" aria-hidden />
        </a>
      </div>
    </footer>
  );
}
