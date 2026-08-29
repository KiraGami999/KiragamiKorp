import {
  Smartphone,
  Globe,
  Bot,
  Terminal,
  Boxes,
  Sparkles,
} from "lucide-react";
import type { Service } from "@/types";

export const services: Service[] = [
  {
    id: "mobile",
    index: "01",
    title: "Mobile App Development",
    description:
      "Native-feeling iOS/Android and cross-platform apps, built for performance and shipped through to the app stores.",
    icon: Smartphone,
  },
  {
    id: "web",
    index: "02",
    title: "Web Application Development",
    description:
      "Fast, accessible, production-grade web platforms — from marketing sites to full-stack SaaS products.",
    icon: Globe,
  },
  {
    id: "ai-automation",
    index: "03",
    title: "Local AI & Automation",
    description:
      "On-device and self-hosted AI pipelines that automate real workflows without shipping your data to a third party.",
    icon: Bot,
  },
  {
    id: "prompt-engineering",
    index: "04",
    title: "Prompt Engineering",
    description:
      "Structured, testable prompt systems that turn language models into dependable parts of a product.",
    icon: Terminal,
  },
  {
    id: "architecture",
    index: "05",
    title: "Software Architecture",
    description:
      "Systems design that scales with the product — clear boundaries, sane data flow, and code that's built to change.",
    icon: Boxes,
  },
  {
    id: "creative",
    index: "06",
    title: "Creative Digital Experiences",
    description:
      "Interactive, motion-driven interfaces that make a product memorable instead of merely functional.",
    icon: Sparkles,
  },
];
