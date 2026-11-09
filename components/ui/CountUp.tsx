"use client";

import { useEffect, useRef, useState } from "react";

export function CountUp({ value }: { value: string }) {
  const target = Number(value.replace(/[^\d.-]/g, ""));
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(Number.isFinite(target) ? 0 : target);

  useEffect(() => {
    const node = ref.current;
    if (!node || !Number.isFinite(target) || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          setShown(target);
          return;
        }

        const start = performance.now();
        const duration = 900;
        const tick = (now: number) => {
          const progress = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - progress, 3);
          setShown(Math.round(target * eased));
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [target]);

  return (
    <span ref={ref}>
      {Number.isFinite(target) ? new Intl.NumberFormat("en-AE").format(shown) : value}
    </span>
  );
}
