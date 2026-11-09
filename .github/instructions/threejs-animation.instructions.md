---
description: "Use when adding Three.js, WebGL, interactive 3D or 3D product visualizations."
---
# Three.js animation

- Use 3D only for a suitable approved asset and clear user benefit; never replace essential product information with a canvas.
- Lazy-load client-only scenes and assets, provide a static accessible fallback, and disable nonessential motion for reduced-motion users.
- Limit geometry, texture sizes, device pixel ratio and frame work; test small screens and low-power devices.
- Dispose renderers, geometries, materials and textures, and stop render loops and listeners on unmount.
- Respect existing product imagery and commerce behavior. React Three Fiber is not installed; verify React compatibility before adding it.
