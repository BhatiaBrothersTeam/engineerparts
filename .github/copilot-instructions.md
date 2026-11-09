# Engineerparts project instructions

- This is a Next.js 14 App Router storefront using React 18, TypeScript, Tailwind and WooCommerce. Preserve server/client boundaries and existing commerce, authentication, forms and navigation behavior.
- Reuse existing components and design tokens; preserve the industrial brand, responsive layout and accessible controls.
- Animate progressively: content must remain usable without JavaScript and with reduced motion. Prefer short transform/opacity transitions, and do not delay navigation or checkout.
- Scope GSAP and ScrollTrigger to mounted components, clean up effects and listeners, and respect reduced-motion changes. Keep nested scrolling, dialogs, anchors and browser history working.
- Load 3D and Lottie only for an approved, meaningful use case; do not introduce large assets or client bundles without measuring them.
- Run `npm run typecheck`, `npm run lint`, and relevant tests for changes. Run `npm run build` for production-impacting frontend work.
- Follow the scoped instructions in `.github/instructions/` and use the relevant `.github/skills/` workflows.
