---
name: animation-performance
description: "Use when profiling or optimizing animation, WebGL, Lottie, layout shifts or scroll performance."
---
# Animation performance

1. Identify the interaction, target devices, baseline behavior and relevant bundle or runtime cost.
2. Prefer transforms and opacity; avoid work per scroll frame that triggers layout or React rerenders.
3. Load Three.js or Lottie only for a real use case, dynamically and with static accessible fallbacks.
4. Ensure animation instances, render loops, listeners and GPU resources are disposed.
5. Verify mobile and desktop, reduced motion, stable layout, navigation and relevant build checks; report any unmeasured performance claims.
