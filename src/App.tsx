import { useEffect } from "react";
import Lenis from "lenis";
import { Hero } from "./components/Hero";
import { Season } from "./components/Season";
import { Timeline } from "./components/Timeline";
import { StickyStack } from "./components/StickyStack";
import { Paddock } from "./components/Paddock";
import { Footer } from "./components/Footer";

export function App() {
  useEffect(() => {
    // Scroll restoration & scroll to top
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }
    window.scrollTo(0, 0);

    // Root font scaling above 1920
    const updateRootFontSize = () => {
      if (window.innerWidth > 1920) {
        document.documentElement.style.fontSize = `${(16 * window.innerWidth) / 1920}px`;
      } else {
        document.documentElement.style.fontSize = "";
      }
    };
    window.addEventListener("resize", updateRootFontSize);
    updateRootFontSize();

    // Smooth scroll with Lenis
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let lenis: Lenis | null = null;
    let rafId: number;

    if (!prefersReducedMotion) {
      lenis = new Lenis({ smoothWheel: true });
      const raf = (time: number) => {
        lenis?.raf(time);
        rafId = requestAnimationFrame(raf);
      };
      rafId = requestAnimationFrame(raf);
    }

    return () => {
      window.removeEventListener("resize", updateRootFontSize);
      if (lenis) {
        lenis.destroy();
        cancelAnimationFrame(rafId);
      }
    };
  }, []);

  return (
    <main>
      {/* Five blocks: first three form the Sticky Stack */}
      <StickyStack
        hero={<Hero />}
        season={<Season />}
        timeline={<Timeline />}
      />

      {/* Section 4: From the paddock */}
      <Paddock />

      {/* Section 5: Keep pushing forward */}
      <Footer />
    </main>
  );
}

export default App;
