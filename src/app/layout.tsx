import type { Metadata, Viewport } from "next";
import { Anton, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const anton = Anton({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

const siteUrl = "https://kiragamikorp.com";
const siteTitle = "KiragamiKorp — Digital Engineering & AI Studio";
const siteDescription =
  "KiragamiKorp is the digital engineering and AI studio of Blessings Mandala — mobile & web application development, local AI automation, prompt engineering, and software architecture built like it's from the future.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteTitle,
    template: "%s — KiragamiKorp",
  },
  description: siteDescription,
  keywords: [
    "KiragamiKorp",
    "Blessings Mandala",
    "software architect",
    "mobile app developer",
    "web application developer",
    "AI automation engineer",
    "prompt engineer",
    "digital product studio",
  ],
  authors: [{ name: "Blessings Mandala" }],
  creator: "Blessings Mandala",
  openGraph: {
    type: "website",
    url: siteUrl,
    title: siteTitle,
    description: siteDescription,
    siteName: "KiragamiKorp",
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${anton.variable} ${spaceGrotesk.variable} ${jetBrainsMono.variable} h-full scroll-smooth`}
    >
      <body className="flex h-full min-h-screen flex-col bg-paper font-sans text-ink antialiased selection:bg-ink selection:text-acid">
        <a
          href="#main-content"
          className="fixed left-4 top-4 z-[100] -translate-y-24 rounded-none border-2 border-ink bg-acid px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest text-ink transition-transform focus:translate-y-0 focus-visible:outline-none"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
