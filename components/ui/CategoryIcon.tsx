const ICON_PROPS = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, className: "h-full w-full" } as const;

function GaugeIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M4 15a8 8 0 1 1 16 0" strokeLinecap="round" />
      <path d="M12 15 15.5 10" strokeLinecap="round" />
      <circle cx="12" cy="15" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  );
}

function PipeIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M4 9h9a3 3 0 0 1 3 3v3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="4" cy="9" r="2.3" />
      <circle cx="16" cy="18" r="2.3" />
    </svg>
  );
}

function RingIcon() {
  return (
    <svg {...ICON_PROPS}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3.2" />
    </svg>
  );
}

function DiscIcon() {
  return (
    <svg {...ICON_PROPS}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="7.5" cy="9.5" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="16.5" cy="9.5" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="7.5" cy="14.5" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="16.5" cy="14.5" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

function HookIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M8 3.5v10a4 4 0 0 0 8 0v-2a2.5 2.5 0 0 0-5 0" strokeLinecap="round" />
      <path d="M5.5 3.5h5" strokeLinecap="round" />
    </svg>
  );
}

function LayersIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="m12 3.5 8 4.5-8 4.5-8-4.5Z" strokeLinejoin="round" />
      <path d="m4 13 8 4.5 8-4.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m4 17 8 4.5 8-4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M12 3.5 19 6.5v5c0 5-3 7.8-7 9-4-1.2-7-4-7-9v-5Z" strokeLinejoin="round" />
      <path d="m9 12 2 2 4-4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function WrenchIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4l-6 6a1.5 1.5 0 0 0 2.1 2.1l6-6a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.1-.7-.7-2.1Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FactoryIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M3.5 20.5V11l4.5 3V11l4.5 3V8l6 4.5v8Z" strokeLinejoin="round" />
      <path d="M3.5 20.5h17" strokeLinecap="round" />
    </svg>
  );
}

function BoxesIcon() {
  return (
    <svg {...ICON_PROPS}>
      <rect x="3.5" y="10.5" width="7" height="7" rx="0.6" />
      <rect x="13.5" y="10.5" width="7" height="7" rx="0.6" />
      <path d="M7 10.5V7.5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ScreenIcon() {
  return (
    <svg {...ICON_PROPS}>
      <rect x="3.5" y="4.5" width="17" height="11" rx="1.4" />
      <path d="M9 20h6M12 15.5V20" strokeLinecap="round" />
    </svg>
  );
}

function TagIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M11.5 3.5h6a1 1 0 0 1 1 1v6a1 1 0 0 1-.3.7l-9 9a1 1 0 0 1-1.4 0l-6-6a1 1 0 0 1 0-1.4l9-9a1 1 0 0 1 .7-.3Z" strokeLinejoin="round" />
      <circle cx="15.5" cy="7.5" r="1.4" />
    </svg>
  );
}

const CATEGORY_ICON_RULES: [RegExp, () => JSX.Element][] = [
  [/instrument|gauge|sensor|meter/, GaugeIcon],
  [/valve|pipe|tube|nipple|olet|coupl|bush|elbow/, PipeIcon],
  [/gasket|seal/, RingIcon],
  [/flange|plate|sheet/, DiscIcon],
  [/lift|crane|rig/, HookIcon],
  [/safety/, ShieldIcon],
  [/tool|hardware|cap\b/, WrenchIcon],
  [/equipment|machin/, FactoryIcon],
  [/lot|bulk/, BoxesIcon],
  [/av\b|audio|video|electronic/, ScreenIcon],
];

export function categoryIconFor(slugOrLabel: string): () => JSX.Element {
  const value = slugOrLabel.toLowerCase();
  const match = CATEGORY_ICON_RULES.find(([pattern]) => pattern.test(value));
  return match ? match[1] : TagIcon;
}

export function CategoryIcon({ category, className = "" }: { category: string; className?: string }) {
  const Icon = categoryIconFor(category);
  return (
    <span className={`inline-flex items-center justify-center ${className}`} aria-hidden="true">
      <Icon />
    </span>
  );
}
