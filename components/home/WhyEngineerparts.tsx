import { IconTile } from "@/components/ui/IconTile";
import { SectionHeading } from "@/components/ui/SectionHeading";

const ITEMS = [
  {
    title: "Verified listings",
    copy: "Condition, specification and stock details are published with every available item.",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "Dedicated clearance desk",
    copy: "A team that responds to enquiries, confirms stock and arranges collection or freight.",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path d="M4 5h16M4 12h16M4 19h10" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Freight & logistics support",
    copy: "From single parts to palletised equipment, we help arrange delivery to your site.",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="7.5" cy="18" r="1.6" />
        <circle cx="17.5" cy="18" r="1.6" />
      </svg>
    ),
  },
  {
    title: "Built for business buyers",
    copy: "Bulk quantities, lots and equipment enquiries are handled with trade pricing in mind.",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path d="M4 21V9l8-5 8 5v12M9 21v-6h6v6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export function WhyEngineerparts() {
  return (
    <div className="mx-auto w-full max-w-7xl">
      <SectionHeading
        eyebrow="Why Engineerparts.com"
        title="Built for industrial buyers"
        description="The clearance desk and catalogue are set up around how business buyers actually source parts and equipment."
      />
      <div className="mt-6 grid gap-3 sm:mt-8 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
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
      </div>
    </div>
  );
}
