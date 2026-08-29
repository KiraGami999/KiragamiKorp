import type { Service } from "@/types";
import { cn } from "@/lib/utils/cn";

interface ServiceRowProps {
  service: Service;
  isOpen: boolean;
  onToggle: () => void;
}

export function ServiceRow({ service, isOpen, onToggle }: ServiceRowProps) {
  const Icon = service.icon;
  const panelId = `service-panel-${service.id}`;

  return (
    <li className="border-b-2 border-ink">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={panelId}
        className={cn(
          "group flex w-full items-center justify-between gap-4 px-2 py-7 text-left transition-colors duration-200 sm:gap-10 sm:px-4 sm:py-9",
          isOpen ? "bg-ink text-acid" : "bg-transparent text-ink hover:bg-ink hover:text-acid",
        )}
      >
        <span className="flex min-w-0 items-center gap-4 sm:gap-10">
          <span className="font-mono text-xs text-current/50 sm:text-sm">{service.index}</span>
          <span className="truncate font-display text-2xl uppercase tracking-tight sm:text-4xl lg:text-5xl">
            {service.title}
          </span>
        </span>
        <Icon
          className={cn(
            "h-6 w-6 shrink-0 transition-transform duration-300",
            isOpen ? "rotate-45" : "group-hover:rotate-45",
          )}
          aria-hidden
        />
      </button>

      <div
        id={panelId}
        role="region"
        aria-label={`${service.title} details`}
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-out",
          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <p className="max-w-2xl px-2 pb-8 pt-3 font-mono text-sm leading-relaxed text-ink/70 sm:px-4 sm:text-base">
            {service.description}
          </p>
        </div>
      </div>
    </li>
  );
}
