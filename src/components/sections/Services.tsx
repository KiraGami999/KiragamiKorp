"use client";

import { useState } from "react";
import { services } from "@/lib/data/services";
import { SectionEyebrow } from "@/components/ui/SectionEyebrow";
import { RevealLines } from "@/components/ui/RevealText";
import { ServiceRow } from "@/components/ui/ServiceRow";

export function Services() {
  const [openId, setOpenId] = useState<string | null>(services[0]?.id ?? null);

  return (
    <section id="services" aria-labelledby="services-heading" className="bg-paper py-24 sm:py-32">
      <div className="mx-auto max-w-[1600px] px-6 sm:px-10 lg:px-16">
        <div className="mb-14 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <SectionEyebrow className="mb-4 text-ink/70">LOG.02 — SERVICES</SectionEyebrow>
            <RevealLines
              lines={["WHAT WE", "ENGINEER."]}
              as="h2"
              id="services-heading"
              lineClassName="font-display text-ink text-[13vw] leading-[0.9] sm:text-[6vw] lg:text-[4.5vw]"
            />
          </div>
          <p className="max-w-xs font-mono text-xs uppercase leading-relaxed tracking-widest text-ink/60">
            Six disciplines, one studio. Select a line to expand it.
          </p>
        </div>

        <ul className="border-t-2 border-ink">
          {services.map((service) => (
            <ServiceRow
              key={service.id}
              service={service}
              isOpen={openId === service.id}
              onToggle={() =>
                setOpenId((current) => (current === service.id ? null : service.id))
              }
            />
          ))}
        </ul>
      </div>
    </section>
  );
}
