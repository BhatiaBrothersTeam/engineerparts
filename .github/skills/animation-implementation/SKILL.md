---
name: animation-implementation
description: "Use when implementing or reviewing GSAP, Motion, Lenis, scroll reveals, parallax or accessible website animations."
---
# Animation implementation

1. Inspect the affected components, existing effects, navigation and responsive layout before changing them.
2. Choose the smallest meaningful effect and reuse existing styling or animation primitives. Keep server content visible without JavaScript.
3. Use Motion for component interaction and GSAP/ScrollTrigger for scoped scroll effects. Coordinate with Lenis without changing native anchors or dialog scrolling.
4. Disable nonessential motion under `prefers-reduced-motion`, including preference changes; clean up effects and listeners.
5. Test keyboard and touch interactions, reduced motion, route changes and mobile/desktop layout. Run typecheck, lint and the production build.
