---
description: "Use when changing frontend performance, animations, assets or client-side bundles."
---
# Frontend performance

- Prefer server components and static CSS; add client JavaScript only where interaction needs it.
- Lazy-load optional Three.js, Lottie and large media; avoid loading them globally for unused effects.
- Aim for smooth rendering on representative devices, avoid layout reads in scroll loops, and stop work outside its lifecycle.
- Reserve asset dimensions to prevent layout shifts. Avoid persistent compositing hints and unnecessary React state updates per frame.
- Check production build output, desktop and mobile performance, reduced motion and interaction regressions.
