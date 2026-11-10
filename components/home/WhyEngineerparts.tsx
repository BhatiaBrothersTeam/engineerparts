import { IconTile } from "@/components/ui/IconTile";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { RevealGroup } from "@/components/ui/Reveal";

const ITEMS = [
  {
    title: "70+ years of experience",
    copy: "Industry experience informs the practical support we provide to maintenance and procurement teams.",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "Part identification support",
    copy: "Share a part number, equipment details, specifications or a label photo so we can help narrow down your options.",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path d="M4 5h16M4 12h16M4 19h10" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Delivery coordination",
    copy: "We check availability, provide an estimated timeline and coordinate dispatch around your destination and required date.",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="7.5" cy="18" r="1.6" />
        <circle cx="17.5" cy="18" r="1.6" />
      </svg>
    ),
  },
  {
    title: "One part or a full list",
    copy: "Request one replacement component or send a complete parts list for planned maintenance.",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path d="M4 21V9l8-5 8 5v12M9 21v-6h6v6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export function WhyEngineerparts() {
  return (
    <div className="w-full">
      <SectionHeading
        eyebrow="Why Engineerparts.com"
        title="Practical support for industrial buyers"
        description="From identifying the right component to coordinating delivery, we help you source spare parts with greater confidence."
      />
      <RevealGroup className="mt-6 grid gap-3 sm:mt-8 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
        {ITEMS.map((item) => (
          <div key={item.title} className="card relative flex gap-4 overflow-hidden p-4 sm:min-h-[230px] sm:block sm:p-6">
            <span className="absolute inset-y-0 left-0 w-1 bg-brand-600 sm:inset-x-0 sm:bottom-auto sm:h-1 sm:w-auto" aria-hidden="true" />
            <IconTile size="lg">{item.icon}</IconTile>
            <div className="min-w-0">
              <h3 className="text-h4 text-navy-900 sm:mt-5">{item.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-steel-600 sm:mt-2">{item.copy}</p>
            </div>
          </div>
        ))}
      </RevealGroup>
    </div>
  );
}
