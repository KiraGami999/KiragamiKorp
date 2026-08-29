import { AtSign, Briefcase, Code2, Mail } from "lucide-react";
import type { SocialLink } from "@/types";

/**
 * Placeholder URLs — replace with the real profile links. Lucide dropped
 * brand/logo glyphs (GitHub, LinkedIn, X), so generic icons stand in for
 * them here to stay within the requested icon set.
 */
export const socials: SocialLink[] = [
  {
    id: "github",
    platform: "GitHub",
    href: "https://github.com/kiragamikorp",
    icon: Code2,
  },
  {
    id: "linkedin",
    platform: "LinkedIn",
    href: "https://www.linkedin.com/in/blessings-mandala",
    icon: Briefcase,
  },
  {
    id: "x",
    platform: "X",
    href: "https://x.com/kiragamikorp",
    icon: AtSign,
  },
  {
    id: "email",
    platform: "Email",
    href: "mailto:hello@kiragamikorp.com",
    icon: Mail,
  },
];
