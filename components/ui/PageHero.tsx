import type { ReactNode } from "react";
import { Breadcrumbs, type Crumb } from "@/components/ui/Breadcrumbs";
import { GearMark } from "@/components/ui/GearMark";

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
  const hasAside = Boolean(stats?.length || children);

  return (
    <section
      className={
        dark
          ? "relative isolate overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700"
          : "border-b border-navy-100 bg-navy-50"
      }
    >
      {dark ? (
        <>
          {/* Depth without noise: faint grid fading left, soft glow and the logo gear on the right. */}
          <div
            className="bg-grid-dark pointer-events-none absolute inset-0 -z-10 [mask-image:linear-gradient(to_left,black,transparent_70%)]"
            aria-hidden="true"
          />
          <div className="pointer-events-none absolute -right-24 top-1/2 -z-10 h-96 w-96 -translate-y-1/2 rounded-full bg-brand-400/25 blur-3xl" aria-hidden="true" />
          <GearMark className="pointer-events-none absolute -right-16 top-1/2 -z-10 hidden h-[150%] max-h-[26rem] -translate-y-1/2 text-white/[0.045] md:block lg:-right-6 2xl:right-0" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" aria-hidden="true" />
        </>
      ) : null}

      <div className="shell py-8 sm:py-10 lg:py-12">
        <Breadcrumbs items={breadcrumbs} light={dark} />
        <div
          className={
            hasAside
              ? "mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-12"
              : "mt-5"
          }
        >
          <div className="max-w-3xl">
            {eyebrow ? (
              <p className={["eyebrow", dark ? "text-brand-200" : "text-brand-600"].join(" ")}>{eyebrow}</p>
            ) : null}
            <h1 className={["text-h1 mt-2", dark ? "text-white" : "text-navy-900"].join(" ")}>{title}</h1>
            {description ? (
              <p className={["text-lead mt-3 max-w-2xl", dark ? "text-brand-100/85" : "text-steel-600"].join(" ")}>
                {description}
              </p>
            ) : null}
          </div>

          {hasAside ? (
            <div className="flex flex-col gap-4 lg:items-end">
              {stats?.length ? (
                <dl className="flex flex-wrap gap-2 sm:gap-3">
                  {stats.map(([value, label]) => (
                    <div
                      key={label}
                      className={
                        dark
                          ? "flex min-w-[7.5rem] flex-col-reverse rounded-lg border border-white/15 bg-white/[0.07] px-4 py-3 backdrop-blur-sm"
                          : "flex min-w-[7.5rem] flex-col-reverse rounded-lg border border-navy-100 bg-white px-4 py-3 shadow-card"
                      }
                    >
                      {/* Label first for screen readers; flex-col-reverse shows the number on top. */}
                      <dt className={["mt-1.5 text-[11px] font-semibold uppercase tracking-wide", dark ? "text-brand-200" : "text-steel-500"].join(" ")}>
                        {label}
                      </dt>
                      <dd className={["text-2xl font-extrabold tabular-nums leading-none", dark ? "text-white" : "text-navy-900"].join(" ")}>
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : null}
              {children ? <div className="shrink-0">{children}</div> : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
