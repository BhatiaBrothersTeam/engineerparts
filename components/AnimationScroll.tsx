"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function AnimationScroll() {
  useEffect(() => {
    const media = gsap.matchMedia();
    media.add("(min-width: 1024px) and (hover: hover) and (prefers-reduced-motion: no-preference)", () => {
      const lenis = new Lenis({
        lerp: 0.13,
        allowNestedScroll: true,
        prevent: (node) => document.body.style.overflow === "hidden" || Boolean(node.closest('[role="dialog"]')),
      });
      const update = (time: number) => lenis.raf(time * 1000);
      const syncScrollLock = () => {
        if (document.body.style.overflow === "hidden") lenis.stop();
        else lenis.start();
      };
      const observer = new MutationObserver(syncScrollLock);
      observer.observe(document.body, { attributes: true, attributeFilter: ["style"] });
      syncScrollLock();
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(update);
      return () => {
        observer.disconnect();
        gsap.ticker.remove(update);
        lenis.off("scroll", ScrollTrigger.update);
        lenis.destroy();
      };
    });
    return () => media.revert();
  }, []);

  return null;
}
