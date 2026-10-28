import Link from "next/link";
import { WHATSAPP_NUMBER, whatsappLink } from "@/lib/utils";

export function TopBar() {
  return (
    <div className="bg-navy-950 text-steel-300">
      <div className="shell flex h-9 items-center justify-center gap-4 text-[11px] font-semibold uppercase tracking-wide sm:justify-between">
        <div className="hidden min-w-0 items-center gap-2 sm:flex">
          <span className="relative flex h-1.5 w-1.5 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </span>
          <span className="truncate text-white">Live clearance stock</span>
          <span aria-hidden="true" className="text-steel-600">
            &middot;
          </span>
          <span className="truncate">UAE-wide delivery &amp; collection by appointment</span>
        </div>
        <Link href="/about" className="truncate text-brand-300 transition-colors hover:text-brand-200 sm:hidden lg:ml-auto lg:inline">
          Surplus, dead stock &amp; engineered parts
        </Link>
        {WHATSAPP_NUMBER ? (
          <a
            href={whatsappLink("Hello Engineerparts.com, I would like to enquire about your clearance stock.")}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden shrink-0 items-center gap-1.5 text-white transition-colors hover:text-emerald-300 lg:inline-flex"
          >
            <WhatsAppDotIcon />
            WhatsApp
          </a>
        ) : null}
      </div>
    </div>
  );
}

function WhatsAppDotIcon() {
  return (
    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.04 2C6.6 2 2.2 6.4 2.2 11.84c0 1.74.46 3.44 1.32 4.94L2 22l5.36-1.4a9.9 9.9 0 0 0 4.68 1.2h.01c5.43 0 9.84-4.4 9.84-9.84C21.89 6.4 17.47 2 12.04 2Zm5.75 13.9c-.24.68-1.42 1.3-1.96 1.34-.5.05-1.12.08-1.8-.1-.42-.13-.96-.31-1.66-.61-2.92-1.26-4.83-4.2-4.98-4.4-.14-.2-1.19-1.58-1.19-3.02 0-1.43.75-2.13 1.02-2.43.27-.29.58-.36.78-.36l.56.01c.18.01.42-.07.66.5.24.58.82 2 .89 2.14.07.14.12.31.02.5-.09.2-.14.32-.28.5-.14.17-.3.38-.43.51-.14.14-.29.29-.13.57.17.29.74 1.22 1.58 1.97 1.09.97 2 1.28 2.29 1.42.28.14.45.12.62-.07.17-.2.72-.84.91-1.12.19-.29.38-.24.64-.14.26.09 1.66.78 1.94.92.29.14.48.21.55.33.07.12.07.7-.17 1.38Z" />
    </svg>
  );
}
