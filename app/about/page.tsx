import type { Metadata } from "next";
import Link from "next/link";
import { IconTile } from "@/components/ui/IconTile";
import { PageHero } from "@/components/ui/PageHero";
import { Reveal, RevealGroup } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn how Engineer Parts helps maintenance and procurement teams source industrial spare parts for repairs and planned maintenance.",
};

const REQUIREMENTS = [
  {
    title: "A part number",
    copy: "Send the manufacturer and part number so we can check the available options.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path d="M7 3h7l4 4v14H7z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M14 3v5h5M10 13h5M10 17h5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Equipment details",
    copy: "Share the make, model, dimensions, specifications or a clear photo of the existing label.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <circle cx="12" cy="12" r="3" />
        <path d="M19 13.5v-3l-2-.7a7 7 0 0 0-.8-1.8l.9-1.9-2.2-2.2-1.9.9a7 7 0 0 0-1.8-.8l-.7-2h-3l-.7 2a7 7 0 0 0-1.8.8l-1.9-.9L.9 6.1 1.8 8a7 7 0 0 0-.8 1.8l-2 .7v3l2 .7a7 7 0 0 0 .8 1.8l-.9 1.9 2.2 2.2 1.9-.9a7 7 0 0 0 1.8.8l.7 2h3l.7-2a7 7 0 0 0 1.8-.8l1.9.9 2.2-2.2-.9-1.9a7 7 0 0 0 .8-1.8z" transform="translate(2)" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "A complete parts list",
    copy: "Send several requirements together for planned maintenance, a shutdown or a larger repair.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path d="M9 6h11M9 12h11M9 18h11" strokeLinecap="round" />
        <path d="m3.5 6 1 1 2-2M3.5 12l1 1 2-2M3.5 18l1 1 2-2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

const PROCESS = [
  {
    title: "Share your requirement",
    copy: "Tell us what you need, where it will be used and when it is required.",
  },
  {
    title: "Identify the right component",
    copy: "We review part numbers, equipment details and technical specifications, then clarify any gaps.",
  },
  {
    title: "Confirm availability",
    copy: "We check sourcing options and provide the relevant commercial details and estimated timeline.",
  },
  {
    title: "Coordinate delivery",
    copy: "Once confirmed, we arrange dispatch and communicate the expected delivery timing.",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        breadcrumbs={[{ label: "About" }]}
        eyebrow="About Engineer Parts"
        title="Industrial spare-parts sourcing, made clearer"
        description="Backed by over 70 years of industry experience, we help maintenance and procurement teams identify the right component, check availability and plan around delivery timelines."
      />

      <section className="border-b border-navy-100 bg-white">
        <div className="shell grid grid-cols-2 divide-x divide-navy-100 py-6 lg:grid-cols-4 lg:py-8">
          {[
            ["70+", "Years of industry experience"],
            ["Maintenance", "Repair and replacement support"],
            ["Procurement", "Clearer purchasing decisions"],
            ["Urgent or planned", "Breakdowns and shutdowns"],
          ].map(([value, label]) => (
            <div key={value} className="px-3 text-center first:pl-0 last:pr-0 sm:px-6">
              <p className="text-h3 text-brand-700">{value}</p>
              <p className="mt-1 text-xs leading-5 text-steel-600 sm:text-sm">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="shell grid items-start gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <Reveal>
            <p className="eyebrow text-brand-600">Company overview</p>
            <h2 className="text-h2 mt-3 max-w-2xl text-navy-900">
              Practical support for the people keeping equipment running
            </h2>
            <div className="mt-5 max-w-2xl space-y-4 text-base leading-relaxed text-steel-700">
              <p>
                Engineer Parts helps maintenance and procurement teams source industrial spare parts
                for repairs, replacements and planned maintenance.
              </p>
              <p>
                Whether you&apos;re dealing with an unexpected breakdown or preparing for a
                scheduled shutdown, we help you move from technical information to a clearer
                purchasing decision.
              </p>
            </div>
          </Reveal>

          <Reveal delay={90}>
            <article className="relative overflow-hidden rounded-card bg-navy-900 p-6 text-white shadow-lift sm:p-8">
              <span className="absolute inset-y-0 left-0 w-1.5 bg-brand-500" aria-hidden="true" />
              <p className="eyebrow text-brand-300">Our mission</p>
              <h2 className="text-h3 mt-3">Make industrial spare parts easier to source.</h2>
              <p className="mt-4 text-sm leading-6 text-steel-200 sm:text-base sm:leading-7">
                We help customers turn part numbers, equipment details and technical specifications
                into clear purchasing decisions, so they can spend less time searching and more time
                keeping operations running.
              </p>
            </article>
          </Reveal>
        </div>
      </section>

      <section className="section section-alt">
        <div className="shell">
          <SectionHeading
            eyebrow="What to send us"
            title="Start with the information you already have"
            description="You do not need a perfectly prepared specification. Send us the best available information and we will help narrow down the options."
          />
          <RevealGroup className="mt-8 grid gap-4 md:grid-cols-3">
            {REQUIREMENTS.map((item) => (
              <article key={item.title} className="card h-full p-5 sm:p-6">
                <IconTile size="lg">{item.icon}</IconTile>
                <h3 className="text-h4 mt-5 text-navy-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-steel-600">{item.copy}</p>
              </article>
            ))}
          </RevealGroup>
        </div>
      </section>

      <section className="section">
        <div className="shell">
          <SectionHeading
            eyebrow="How we help"
            title="From requirement to delivery"
            description="A straightforward sourcing process with clear checks at every stage."
          />
          <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PROCESS.map((item, index) => (
              <li key={item.title}>
                <Reveal delay={index * 70} className="h-full">
                  <article className="h-full border-t-2 border-brand-600 bg-white px-1 pb-2 pt-5">
                    <span className="text-xs font-bold tracking-[0.16em] text-brand-600">
                      0{index + 1}
                    </span>
                    <h3 className="text-h4 mt-3 text-navy-900">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-steel-600">{item.copy}</p>
                  </article>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section border-y border-navy-100 bg-navy-50">
        <div className="shell grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <p className="eyebrow text-brand-600">Quality assurance</p>
            <h2 className="text-h2 mt-3 text-navy-900">Details checked before you commit</h2>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-steel-700">
              Small differences in specifications can affect how a part fits or performs. We review
              the information you provide and flag anything that needs clarification before the
              order is confirmed. This helps reduce the risk of ordering the wrong component and
              delaying the repair.
            </p>
          </Reveal>
          <Reveal delay={90}>
            <ul className="grid gap-3 sm:grid-cols-2">
              {[
                "Part numbers and manufacturer details",
                "Dimensions and technical specifications",
                "Equipment make, model and application",
                "Destination and required delivery date",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 rounded-lg border border-navy-100 bg-white p-4 text-sm font-semibold leading-5 text-navy-800 shadow-card">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700" aria-hidden="true">
                    <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path d="m2 6 2.5 2.5L10 3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      <section className="section">
        <Reveal className="shell">
          <div className="overflow-hidden rounded-card bg-brand-700 px-5 py-8 text-white shadow-lift sm:px-8 sm:py-10 lg:flex lg:items-center lg:justify-between lg:gap-12 lg:px-12">
            <div className="max-w-3xl">
              <p className="eyebrow text-brand-200">Ready to get started?</p>
              <h2 className="text-h2 mt-3 text-white">
                Send us your part number, equipment details or parts list.
              </h2>
              <p className="mt-3 text-sm leading-6 text-brand-100 sm:text-base">
                Tell us your destination and required date too, especially for an urgent repair or
                planned shutdown. We&apos;ll review the available options with you.
              </p>
            </div>
            <div className="mt-6 flex shrink-0 flex-wrap gap-3 lg:mt-0">
              <Link href="/enquiry" className="btn bg-white text-brand-800 hover:bg-brand-50">
                Request a quote
              </Link>
              <Link href="/contact" className="btn border border-brand-300 text-white hover:bg-brand-600">
                Contact us
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
