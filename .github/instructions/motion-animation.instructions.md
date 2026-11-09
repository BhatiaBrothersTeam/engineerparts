---
description: "Use when adding Motion component animations, hover effects or route transitions."
---
# Motion animation

- Import from `motion/react` in client components and use existing React 18-compatible Motion.
- Disable movement, including hover and tap transforms, and subscribe to live reduced-motion preference changes; preserve visible focus. Use a CSS reduced-motion override as a fallback.
- Prefer transform and opacity, subtle easing and short durations. Do not hide server-rendered content pending hydration.
- Keep navigation immediate, preserve history and focus, and avoid wrapping every card in an expensive animation.
- Check interactions on touch, keyboard and desktop; clean up any custom listeners.
