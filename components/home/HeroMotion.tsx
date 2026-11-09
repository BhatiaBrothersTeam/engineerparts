"use client";

import { useEffect, useRef, useSyncExternalStore, type ReactNode } from "react";
import { motion } from "motion/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const reducedMotionQuery = "(prefers-reduced-motion: reduce)";

function subscribeToMotionPreference(onChange: () => void) {
  const media = window.matchMedia(reducedMotionQuery);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function getReducedMotion() {
  return window.matchMedia(reducedMotionQuery).matches;
}

function getServerReducedMotion() {
  return true;
}

export function HeroImageMotion({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    const image = node?.querySelector("img");
    if (!node || !image) return;

    const media = gsap.matchMedia();
    media.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
      gsap.fromTo(image, { yPercent: -3, scale: 1.07 }, {
        yPercent: 3,
        scale: 1.07,
        ease: "none",
        scrollTrigger: { trigger: node, start: "top bottom", end: "bottom top", scrub: true },
      });
    });
    return () => media.revert();
  }, []);

  return (
    <div ref={ref} className="hero-settle relative min-h-[200px] overflow-hidden rounded-card border border-navy-100 bg-navy-900 shadow-lift sm:min-h-[280px] lg:min-h-[420px]">
      {children}
    </div>
  );
}

export function HeroActionMotion({ children }: { children: ReactNode }) {
  const reducedMotion = useSyncExternalStore(subscribeToMotionPreference, getReducedMotion, getServerReducedMotion);
  return (
    <motion.div
      className="flex motion-reduce:!transform-none"
      whileHover={reducedMotion ? undefined : { y: -2 }}
      whileTap={reducedMotion ? undefined : { scale: 0.98 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
