---
description: "Use when implementing responsive animation, smooth scrolling, parallax or reduced-motion behavior."
---
# Responsive and accessible animation

- Start with a usable static layout; add motion only when supported and requested by user preferences.
- Respect live `prefers-reduced-motion` changes, including JavaScript animations and smooth scrolling.
- Keep controls operable with touch, keyboard and assistive technology; preserve focus and native scrolling in dialogs.
- Test narrow, tablet and desktop viewports; avoid sideways overflow and motion that obscures content.
- Reserve image and animation dimensions and prefer transforms and opacity over layout-changing properties.
