import type { ReactNode } from "react";
import { Breadcrumbs, type Crumb } from "@/components/ui/Breadcrumbs";
import { StatRow } from "@/components/ui/StatRow";

export function PageHero({
  breadcrumbs,
  eyebrow,
  title,
  description,
  children,
  stats,
  tone = "dark",
}: {
  breadcrumbs: Crumb[];
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
  stats?: [string, string][];
  tone?: "dark" | "light";
}) {
  const dark = tone === "dark";
  return (
    <section
      className={
        dark
          ? "relative overflow-hidden border-b border-navy-800 bg-navy-950"
          : "border-b border-navy-100 bg-navy-50"
      }
    >
      {dark ? (
        <>
          <div className="bg-grid-dark pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent)]" aria-hidden="true" />
          <div className="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full bg-brand-600/20 blur-3xl" aria-hidden="true" />
        </>
      ) : null}
      <div className="shell relative py-7 sm:py-9 lg:py-12">
        <Breadcrumbs items={breadcrumbs} light={dark} />
        <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            {eyebrow ? (
              <p className={["eyebrow", dark ? "text-brand-300" : "text-brand-600"].join(" ")}>
                {eyebrow}
              </p>
            ) : null}
            <h1
              className={[
                "text-h1 mt-2",
                dark ? "text-white" : "text-navy-900",
              ].join(" ")}
            >
              {title}
            </h1>
            {description ? (
              <p
                className={[
                  "text-lead mt-3",
                  dark ? "text-steel-300" : "text-steel-600",
                ].join(" ")}
              >
                {description}
              </p>
            ) : null}
          </div>
          {children ? <div className="shrink-0">{children}</div> : null}
        </div>
        {stats?.length ? (
          <div className="mt-6 max-w-xl sm:mt-7">
            <StatRow stats={stats} />
          </div>
        ) : null}
      </div>
    </section>
  );
}
