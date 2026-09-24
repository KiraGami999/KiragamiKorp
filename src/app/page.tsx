import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CustomCursor } from "@/components/layout/CustomCursor";
import { Hero } from "@/components/sections/Hero";
import { DisciplinesMarquee } from "@/components/sections/DisciplinesMarquee";
import { About } from "@/components/sections/About";
import { Services } from "@/components/sections/Services";
import { Contact } from "@/components/sections/Contact";
import { DynamicHeavySections } from "@/components/sections/DynamicHeavySections";
import { getSiteContent } from "@/lib/content/store";

export const dynamic = "force-dynamic";

export default async function Home() {
  const content = await getSiteContent();

  return (
    <>
      <CustomCursor />
      <Header />
      <main id="main-content">
        <Hero site={content.site} />
        <DisciplinesMarquee disciplines={content.site.disciplines} />
        <About site={content.site} stats={content.stats} />
        <Services />
        <DynamicHeavySections projects={content.projects} />
        <Contact site={content.site} />
      </main>
      <Footer site={content.site} />
    </>
  );
}
