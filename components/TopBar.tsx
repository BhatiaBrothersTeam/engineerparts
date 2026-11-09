import Link from "next/link";

export function TopBar() {
  return (
    <div className="sticky top-0 z-[60] bg-navy-950 text-steel-300">
      <div className="shell grid h-16 grid-cols-[minmax(0,1fr)_auto] grid-rows-[1fr_auto] items-center gap-x-3 pb-1 pt-1 text-xs font-semibold uppercase tracking-wide sm:h-11 sm:grid-cols-3 sm:grid-rows-1 sm:py-0">
        <div className="hidden min-w-0 items-center md:flex">
          <span className="truncate">UAE-wide delivery &amp; collection by appointment</span>
        </div>
        <div className="hidden items-center justify-center gap-2 sm:flex">
          <LiveStockLabel />
        </div>
        <div className="flex min-w-0 items-center gap-2 sm:hidden">
          <LiveStockLabel />
        </div>
        <div className="col-span-2 row-start-2 text-center text-[10px] leading-none sm:hidden">
          UAE-wide delivery &amp; collection by appointment
        </div>
        <Link
          href="/enquiry"
          className="btn-primary btn-sm shrink-0 !min-h-9 !px-4 !text-sm sm:justify-self-end"
        >
          Enquire Now
        </Link>
      </div>
    </div>
  );
}

function LiveStockLabel() {
  return (
    <>
      <span className="relative flex h-1.5 w-1.5 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
      </span>
      <span className="truncate text-white">Live Clearance Stock</span>
    </>
  );
}
