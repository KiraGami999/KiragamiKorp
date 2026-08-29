import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CustomCursor } from "@/components/layout/CustomCursor";
import { Hero } from "@/components/sections/Hero";
import { DisciplinesMarquee } from "@/components/sections/DisciplinesMarquee";
import { About } from "@/components/sections/About";
import { Services } from "@/components/sections/Services";
import { Contact } from "@/components/sections/Contact";
import { DynamicHeavySections } from "@/components/sections/DynamicHeavySections";

export default function Home() {
  return (
    <>
      <CustomCursor />
      <Header />
      <main id="main-content">
        <Hero />
        <DisciplinesMarquee />
        <About />
        <Services />
        <DynamicHeavySections />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
