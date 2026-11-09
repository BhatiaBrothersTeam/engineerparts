"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function Reveal({
  children,
  delay = 0,
  shift = 20,
  className,
}: {
  children: ReactNode;
  delay?: number;
  shift?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const rect = node.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) return;
      gsap.fromTo(node, { opacity: 0, y: shift }, {
        opacity: 1,
        y: 0,
        duration: 0.62,
        delay: delay / 1000,
        ease: "power3.out",
        scrollTrigger: { trigger: node, start: "top 90%", once: true },
      });
    });
    return () => media.revert();
  }, [delay, shift]);

  return (
    <div
      ref={ref}
      data-reveal=""
      className={className}
    >
      {children}
    </div>
  );
}

export function RevealGroup({
  children,
  className,
  step = 70,
}: {
  children: ReactNode[];
  className?: string;
  step?: number;
}) {
  return (
    <div className={className}>
      {children.map((child, index) => (
        <Reveal key={index} delay={Math.min(index * step, 420)} className="h-full">
          {child}
        </Reveal>
      ))}
    </div>
  );
}
