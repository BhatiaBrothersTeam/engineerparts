---
description: "Use when implementing GSAP timelines, ScrollTrigger, scroll reveals or parallax."
---
# GSAP animation

- Use client components only where browser APIs are needed. Reuse GSAP and ScrollTrigger.
- Scope timelines with `gsap.context` or `gsap.matchMedia` and revert on unmount or preference changes; remove tickers and listeners.
- Use `prefers-reduced-motion: no-preference` and desktop breakpoints for nonessential parallax. Keep content visible without JavaScript.
- Animate transforms and opacity, avoid permanent `will-change`, and measure scroll performance on mobile.
- Preserve native anchor navigation, nested scrolling, focus and dialogs; do not pin transactional content.
