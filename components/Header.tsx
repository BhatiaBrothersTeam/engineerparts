"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, useEffect, useRef, useState } from "react";
import { Logo } from "@/components/Logo";
import { SearchBar } from "@/components/SearchBar";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { useCart } from "@/components/providers/CartProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { primaryNav } from "@/lib/nav";
import { track } from "@/lib/analytics";
import type { CategorySummaryItem } from "@/lib/categories";
import { WHATSAPP_NUMBER, cn, openWhatsApp } from "@/lib/utils";

const NAV_ICON: Record<string, () => JSX.Element> = {
  "/clearance": TagIcon,
  "/brands": BuildingIcon,
  "/recently-added": SparkleIcon,
  "/about": InfoIcon,
  "/contact": MailIcon,
};

const MAX_NAV_CATEGORIES = 8;

export function Header({ categories = [] }: { categories?: CategorySummaryItem[] }) {
  const pathname = usePathname();
  const { count } = useCart();
  const { authenticated, customer, loading, logout } = useAuth();
  const navCategories = categories.slice(0, MAX_NAV_CATEGORIES);
  const [categoriesExpanded, setCategoriesExpanded] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [clearanceOpen, setClearanceOpen] = useState(false);
  const [clearanceExpanded, setClearanceExpanded] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const drawerHasOpened = useRef(false);

  useEffect(() => {
    setMobileOpen(false);
    setCategoriesOpen(false);
    setCategoriesExpanded(false);
    setClearanceOpen(false);
    setClearanceExpanded(false);
    setAccountOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen && !categoriesOpen && !clearanceOpen && !accountOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setMobileOpen(false);
      setCategoriesOpen(false);
      setClearanceOpen(false);
      setAccountOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen, categoriesOpen, clearanceOpen, accountOpen]);

  useEffect(() => {
    if (mobileOpen) {
      drawerHasOpened.current = true;
      drawerRef.current?.focus();
    } else if (drawerHasOpened.current) {
      menuButtonRef.current?.focus();
    }
  }, [mobileOpen]);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
  // /clearance/<category> highlights "Categories"; retail and wholesale belong to "Clearance Stock".
  const onCategoryPage = pathname.startsWith("/clearance/") && !/^\/clearance\/(retail|wholesale)(\/|$)/.test(pathname);
  const accountHref = authenticated ? "/account" : "/login";
  const accountLabel = loading ? "Account" : authenticated ? customer?.firstName || "My Account" : "Login / Account";

  function onWhatsApp(context = "General enquiry") {
    track("whatsapp_click", { source: context });
    openWhatsApp(`Hello Engineerparts.com, I would like to enquire about your clearance stock. (${context})`);
  }

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 border-b border-navy-100 bg-white transition-shadow",
          scrolled && "shadow-header",
        )}
      >
        <div className="shell">
          <div className="flex min-w-0 items-center gap-2 py-3 sm:gap-4 lg:gap-8 lg:py-3.5">
            <div className="min-w-0 flex-1 lg:hidden">
              <Logo compact />
            </div>
            <div className="hidden shrink-0 lg:block">
              <Logo />
            </div>

            <div className="hidden min-w-0 flex-1 lg:block lg:max-w-3xl 2xl:max-w-4xl">
              <SearchBar />
            </div>

            <div className="ml-auto flex shrink-0 items-center gap-1.5 lg:gap-1">
              {authenticated ? (
                <div
                  className="relative hidden lg:block"
                  onMouseEnter={() => setAccountOpen(true)}
                  onMouseLeave={() => setAccountOpen(false)}
                >
                  <button
                    type="button"
                    onClick={() => setAccountOpen((open) => !open)}
                    className="header-action"
                    aria-haspopup="true"
                    aria-expanded={accountOpen}
                    aria-label="My account"
                  >
                    <UserIcon />
                    <span className="hidden max-w-28 truncate xl:inline">{accountLabel}</span>
                    <ChevronIcon />
                  </button>
                  {accountOpen ? (
                    <div className="absolute right-0 top-full z-50 w-56 animate-fade-in rounded-md border border-navy-100 bg-white p-2 shadow-lift">
                      <AccountMenuLink href="/account" icon={<UserIcon />}>Dashboard</AccountMenuLink>
                      <AccountMenuLink href="/account/orders" icon={<ReceiptIcon />}>Orders</AccountMenuLink>
                      <AccountMenuLink href="/account/enquiries" icon={<InboxIcon />}>Enquiries</AccountMenuLink>
                      <AccountMenuLink href="/account/saved-products" icon={<HeartIcon />}>Saved Products</AccountMenuLink>
                      <AccountMenuLink href="/account/profile" icon={<UserIcon />}>Profile</AccountMenuLink>
                      <button
                        type="button"
                        onClick={() => void logout()}
                        className="mt-1 flex w-full items-center gap-2.5 rounded-md border-t border-navy-100 px-3 pb-1.5 pt-2.5 text-left text-sm font-semibold text-signal-700 hover:bg-navy-50"
                      >
                        <LogoutIcon /> Sign out
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : (
                <Link href="/login" className="header-action hidden lg:inline-flex" aria-label="Sign in or create account">
                  <UserIcon />
                  <span className="hidden xl:inline">Sign in</span>
                </Link>
              )}

              <Link href="/enquiry" className="header-action hidden lg:inline-flex" aria-label="Enquiry">
                <InboxIcon />
                <span className="hidden xl:inline">Enquiry</span>
              </Link>

              <Link href="/cart" className="header-action relative hidden lg:inline-flex" aria-label={`Cart, ${count} items`}>
                <span className="relative">
                  <CartIcon />
                  {count > 0 ? <CountBubble count={count} className="-right-3 -top-2.5" /> : null}
                </span>
                <span className="hidden xl:inline">Cart</span>
              </Link>

              <Link
                href={accountHref}
                className="hidden h-11 w-11 items-center justify-center rounded-md border border-navy-200 text-navy-800 sm:inline-flex lg:hidden"
                aria-label={authenticated ? "My account" : "Sign in or create account"}
              >
                <UserIcon />
              </Link>

              <Link
                href="/cart"
                className="relative inline-flex h-11 w-11 items-center justify-center rounded-md border border-navy-200 text-navy-800 lg:hidden"
                aria-label={`Cart, ${count} items`}
              >
                <CartIcon />
                {count > 0 ? <CountBubble count={count} /> : null}
              </Link>

              <button
                ref={menuButtonRef}
                type="button"
                onClick={() => setMobileOpen((v) => !v)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-navy-200 text-navy-900 lg:hidden"
                aria-label="Toggle navigation menu"
                aria-expanded={mobileOpen}
              >
                {mobileOpen ? <CloseIcon /> : <MenuIcon />}
              </button>
            </div>
          </div>

          <div className="pb-3 lg:hidden">
            <SearchBar />
          </div>
        </div>

        <div className="hidden border-t border-navy-100 bg-navy-50 lg:block">
          <div className="shell flex items-center justify-between gap-6">
        <nav className="-ml-3 min-w-0" aria-label="Primary">
          <div className="flex items-center">
            {primaryNav.map((item, index) => (
              <Fragment key={item.label}>
                {index === 0 ? (
                  <div
                    className="relative"
                    onMouseEnter={() => setClearanceOpen(true)}
                    onMouseLeave={() => setClearanceOpen(false)}
                  >
                    <button
                      type="button"
                      onClick={() => setClearanceOpen((v) => !v)}
                      className={cn(
                        "flex items-center gap-1 border-b-2 px-3 py-3 text-xs font-semibold uppercase tracking-wide transition-colors",
                        isActive(item.href) && !onCategoryPage
                          ? "border-brand-600 text-brand-700"
                          : "border-transparent text-navy-800 hover:border-navy-300 hover:text-brand-700",
                      )}
                      aria-haspopup="true"
                      aria-expanded={clearanceOpen}
                    >
                      {item.label}
                      <ChevronIcon />
                    </button>
                    {clearanceOpen ? (
                      <div className="absolute left-0 top-full z-50 w-72 animate-fade-in rounded-b-md border border-navy-100 bg-white p-3 shadow-lift">
                        <Link
                          href="/clearance/retail"
                          className="flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors hover:bg-navy-50"
                        >
                          <span className="icon-tile h-9 w-9 shrink-0">
                            <RetailIcon />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm font-semibold text-navy-900">Retail</span>
                            <span className="mt-0.5 block text-xs text-steel-500">
                              Individually priced, buy online
                            </span>
                          </span>
                        </Link>
                        <Link
                          href="/clearance/wholesale"
                          className="flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors hover:bg-navy-50"
                        >
                          <span className="icon-tile h-9 w-9 shrink-0">
                            <WholesaleIcon />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm font-semibold text-navy-900">Wholesale</span>
                            <span className="mt-0.5 block text-xs text-steel-500">
                              Bulk quantities, pricing on request
                            </span>
                          </span>
                        </Link>
                        <Link
                          href="/clearance"
                          className="mt-2 block border-t border-navy-100 px-3 pt-3 text-xs font-semibold uppercase tracking-wide text-brand-700 hover:text-brand-500"
                        >
                          View all clearance stock &rarr;
                        </Link>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <Link
                    href={item.href}
                    className={cn(
                      "whitespace-nowrap border-b-2 px-3 py-3 text-xs font-semibold uppercase tracking-wide transition-colors",
                      isActive(item.href)
                        ? "border-brand-600 text-brand-700"
                        : "border-transparent text-navy-800 hover:border-navy-300 hover:text-brand-700",
                    )}
                  >
                    {item.label}
                  </Link>
                )}
                {index === 0 && navCategories.length ? (
                  <div
                    className="relative"
                    onMouseEnter={() => setCategoriesOpen(true)}
                    onMouseLeave={() => setCategoriesOpen(false)}
                  >
                    <button
                      type="button"
                      onClick={() => setCategoriesOpen((v) => !v)}
                      className={cn(
                        "flex items-center gap-1 border-b-2 px-3 py-3 text-xs font-semibold uppercase tracking-wide transition-colors",
                        onCategoryPage
                          ? "border-brand-600 text-brand-700"
                          : "border-transparent text-navy-800 hover:border-navy-300 hover:text-brand-700",
                      )}
                      aria-haspopup="true"
                      aria-expanded={categoriesOpen}
                    >
                      Categories
                      <ChevronIcon />
                    </button>
                    {categoriesOpen ? (
                      <div className="absolute left-0 top-full z-50 w-[560px] animate-fade-in rounded-b-md border border-navy-100 bg-white p-3 shadow-lift">
                        <div className="grid grid-cols-2 gap-1">
                          {navCategories.map((category) => (
                            <Link
                              key={category.slug}
                              href={`/clearance/${category.slug}`}
                              className="flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors hover:bg-navy-50"
                            >
                              <span className="icon-tile h-9 w-9 shrink-0">
                                <CategoryIcon category={category.slug} className="h-5 w-5" />
                              </span>
                              <span className="min-w-0">
                                <span className="block truncate text-sm font-semibold text-navy-900">
                                  {category.label}
                                </span>
                                <span className="mt-0.5 block text-xs text-steel-500">
                                  {category.count} clearance item{category.count === 1 ? "" : "s"}
                                </span>
                              </span>
                            </Link>
                          ))}
                        </div>
                        <Link
                          href="/clearance"
                          className="mt-2 block border-t border-navy-100 px-3 pt-3 text-xs font-semibold uppercase tracking-wide text-brand-700 hover:text-brand-500"
                        >
                          View all clearance stock &rarr;
                        </Link>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </Fragment>
            ))}
          </div>
        </nav>
            <p className="hidden shrink-0 items-center gap-2 text-xs font-semibold text-steel-600 xl:flex">
              <TruckIcon />
              UAE-wide delivery &amp; collection
            </p>
          </div>
        </div>
      </header>

      {mobileOpen ? (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-navy-950/50"
            onClick={() => setMobileOpen(false)}
          />
          <div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Main navigation"
            tabIndex={-1}
            className="absolute right-0 top-0 h-full w-[88%] max-w-sm overflow-y-auto bg-white pb-24 shadow-lift focus:outline-none"
          >
            <div className="flex items-center justify-between border-b border-navy-100 px-4 py-3">
              <Logo compact />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-navy-200"
                aria-label="Close menu"
              >
                <CloseIcon />
              </button>
            </div>

            <div className="px-4 py-3">
              <div className="grid grid-cols-2 gap-2">
                <Link href={accountHref} className="btn-outline btn-sm justify-start">
                  <UserIcon /> {authenticated ? "Dashboard" : "Login / Account"}
                </Link>
                <Link href="/enquiry" className="btn-outline btn-sm justify-start">
                  <InboxIcon /> Enquiry
                </Link>
              </div>
              {authenticated ? (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <Link href="/account/orders" className="btn-outline btn-sm justify-start">
                    <ReceiptIcon /> Orders
                  </Link>
                  <Link href="/account/enquiries" className="btn-outline btn-sm justify-start">
                    <InboxIcon /> Enquiries
                  </Link>
                  <Link href="/account/saved-products" className="btn-outline btn-sm justify-start">
                    <HeartIcon /> Saved
                  </Link>
                  <button type="button" onClick={() => void logout()} className="btn-outline btn-sm justify-start text-signal-700">
                    <LogoutIcon /> Sign out
                  </button>
                </div>
              ) : null}
              {WHATSAPP_NUMBER ? (
                <button
                  type="button"
                  onClick={() => onWhatsApp("Mobile menu")}
                  className="btn btn-sm mt-2 w-full bg-emerald-500 text-white hover:bg-emerald-600"
                >
                  <WhatsAppIcon /> WhatsApp Us
                </button>
              ) : null}
            </div>

            <nav className="border-t border-navy-100">
              {primaryNav.map((item, index) => {
                const Icon = NAV_ICON[item.href];
                const active = isActive(item.href);
                return (
                  <Fragment key={item.label}>
                    {index === 0 ? (
                      <div className="border-b border-navy-50">
                        <button
                          type="button"
                          onClick={() => setClearanceExpanded((v) => !v)}
                          className={cn(
                            "flex w-full items-center gap-3 px-4 py-3.5 text-sm font-semibold uppercase tracking-wide transition-colors",
                            active && !onCategoryPage ? "bg-brand-50 text-brand-700" : "text-navy-900 hover:bg-navy-50",
                          )}
                          aria-expanded={clearanceExpanded}
                        >
                          {Icon ? (
                            <span
                              className={cn(
                                "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md",
                                active && !onCategoryPage ? "bg-brand-600 text-white" : "bg-navy-900 text-white",
                              )}
                              aria-hidden="true"
                            >
                              <Icon />
                            </span>
                          ) : null}
                          <span className="flex-1 text-left">{item.label}</span>
                          <span aria-hidden="true" className={cn("text-steel-400 transition-transform", clearanceExpanded && "rotate-90")}>
                            <ChevronRightIcon />
                          </span>
                        </button>
                        {clearanceExpanded ? (
                          <div className="bg-navy-50/50 pb-2">
                            <Link href="/clearance" className="block px-4 py-2.5 pl-16 text-sm font-semibold text-navy-800 hover:bg-navy-100">
                              All Clearance Stock
                            </Link>
                            <Link href="/clearance/retail" className="block px-4 py-2.5 pl-16 text-sm font-semibold text-navy-800 hover:bg-navy-100">
                              Retail
                            </Link>
                            <Link href="/clearance/wholesale" className="block px-4 py-2.5 pl-16 text-sm font-semibold text-navy-800 hover:bg-navy-100">
                              Wholesale
                            </Link>
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 border-b border-navy-50 px-4 py-3.5 text-sm font-semibold uppercase tracking-wide transition-colors",
                          active ? "bg-brand-50 text-brand-700" : "text-navy-900 hover:bg-navy-50",
                        )}
                      >
                        {Icon ? (
                          <span
                            className={cn(
                              "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md",
                              active ? "bg-brand-600 text-white" : "bg-navy-900 text-white",
                            )}
                            aria-hidden="true"
                          >
                            <Icon />
                          </span>
                        ) : null}
                        <span className="flex-1">{item.label}</span>
                        <span aria-hidden="true" className="text-steel-300">
                          <ChevronRightIcon />
                        </span>
                      </Link>
                    )}
                    {index === 0 && navCategories.length ? (
                      <div className="border-b border-navy-50">
                        <button
                          type="button"
                          onClick={() => setCategoriesExpanded((v) => !v)}
                          className={cn(
                            "flex w-full items-center gap-3 px-4 py-3.5 text-sm font-semibold uppercase tracking-wide transition-colors",
                            onCategoryPage
                              ? "bg-brand-50 text-brand-700"
                              : "text-navy-900 hover:bg-navy-50",
                          )}
                          aria-expanded={categoriesExpanded}
                        >
                          <span
                            className={cn(
                              "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md",
                              onCategoryPage ? "bg-brand-600 text-white" : "bg-navy-900 text-white",
                            )}
                            aria-hidden="true"
                          >
                            <LayersIcon />
                          </span>
                          <span className="flex-1 text-left">Categories</span>
                          <span aria-hidden="true" className={cn("text-steel-400 transition-transform", categoriesExpanded && "rotate-90")}>
                            <ChevronRightIcon />
                          </span>
                        </button>
                        {categoriesExpanded ? (
                          <div className="bg-navy-50/50 pb-2">
                            {navCategories.map((category) => (
                              <Link
                                key={category.slug}
                                href={`/clearance/${category.slug}`}
                                className="flex items-center gap-3 px-4 py-2.5 pl-8 text-sm font-semibold text-navy-800 hover:bg-navy-100"
                              >
                                <span className="text-steel-500">
                                  <CategoryIcon category={category.slug} className="h-4 w-4" />
                                </span>
                                <span className="flex-1 truncate">{category.label}</span>
                                <span className="text-xs font-normal normal-case text-steel-500">{category.count}</span>
                              </Link>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </Fragment>
                );
              })}
            </nav>

            <div className="px-4 py-4">
              <Link href="/about" className="text-xs leading-relaxed text-steel-600 hover:text-brand-700">
                About Engineerparts.com
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function AccountMenuLink({ href, icon, children }: { href: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Link href={href} className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-semibold text-navy-800 hover:bg-navy-50">
      {icon ? <span className="text-steel-400">{icon}</span> : null}
      {children}
    </Link>
  );
}

function CountBubble({ count, className = "-right-1 -top-1" }: { count: number; className?: string }) {
  return (
    <span className={cn("absolute flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white", className)}>
      {count}
    </span>
  );
}

function TruckIcon() {
  return (
    <svg className="h-4 w-4 text-brand-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="7.5" cy="18" r="1.6" />
      <circle cx="17.5" cy="18" r="1.6" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
      <path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <circle cx="12" cy="8" r="3.4" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" strokeLinecap="round" />
    </svg>
  );
}

function InboxIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path d="M3.5 13.5V7.5A2 2 0 0 1 5.5 5.5h13a2 2 0 0 1 2 2v6m-17 0V18a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-4.5m-17 0h4l1 2h6l1-2h4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path d="M3 5h2l2.2 10.3a2 2 0 0 0 2 1.7h7.6a2 2 0 0 0 2-1.6L20 8H6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9.5" cy="20" r="1.3" />
      <circle cx="17.5" cy="20" r="1.3" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12.04 2C6.6 2 2.2 6.4 2.2 11.84c0 1.74.46 3.44 1.32 4.94L2 22l5.36-1.4a9.9 9.9 0 0 0 4.68 1.2h.01c5.43 0 9.84-4.4 9.84-9.84C21.89 6.4 17.47 2 12.04 2Zm5.75 13.9c-.24.68-1.42 1.3-1.96 1.34-.5.05-1.12.08-1.8-.1-.42-.13-.96-.31-1.66-.61-2.92-1.26-4.83-4.2-4.98-4.4-.14-.2-1.19-1.58-1.19-3.02 0-1.43.75-2.13 1.02-2.43.27-.29.58-.36.78-.36l.56.01c.18.01.42-.07.66.5.24.58.82 2 .89 2.14.07.14.12.31.02.5-.09.2-.14.32-.28.5-.14.17-.3.38-.43.51-.14.14-.29.29-.13.57.17.29.74 1.22 1.58 1.97 1.09.97 2 1.28 2.29 1.42.28.14.45.12.62-.07.17-.2.72-.84.91-1.12.19-.29.38-.24.64-.14.26.09 1.66.78 1.94.92.29.14.48.21.55.33.07.12.07.7-.17 1.38Z" />
    </svg>
  );
}

function TagIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path d="M11.5 3.5h6a1 1 0 0 1 1 1v6a1 1 0 0 1-.3.7l-9 9a1 1 0 0 1-1.4 0l-6-6a1 1 0 0 1 0-1.4l9-9a1 1 0 0 1 .7-.3Z" strokeLinejoin="round" />
      <circle cx="15.5" cy="7.5" r="1.4" />
    </svg>
  );
}

function LayersIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1" />
    </svg>
  );
}

function RetailIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path d="M3 5h2l2.2 10.3a2 2 0 0 0 2 1.7h7.6a2 2 0 0 0 2-1.6L20 8H6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9.5" cy="20" r="1.3" />
      <circle cx="17.5" cy="20" r="1.3" />
    </svg>
  );
}

function WholesaleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <rect x="3.5" y="10.5" width="7" height="7" rx="0.6" />
      <rect x="13.5" y="10.5" width="7" height="7" rx="0.6" />
      <path d="M7 10.5V7.5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path d="M4.5 20.5v-15a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v15M4.5 20.5h15M4.5 20.5v-9l5-3M15.5 20.5v-6h4v6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 8h1.5M8 11.5h1.5M8 15h1.5" strokeLinecap="round" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path d="M12 3.5v4M12 16.5v4M3.5 12h4M16.5 12h4" strokeLinecap="round" />
      <path d="m7 7 2 2M17 17l-2-2M17 7l-2 2M7 17l2-2" strokeLinecap="round" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5.5" strokeLinecap="round" />
      <circle cx="12" cy="8" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ReceiptIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path d="M6 3.5h12v17l-2-1.3-2 1.3-2-1.3-2 1.3-2-1.3-2 1.3v-17Z" strokeLinejoin="round" />
      <path d="M8.5 8h7M8.5 11.5h7M8.5 15h4" strokeLinecap="round" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path d="M12 20s-7.5-4.6-9.8-9A5.3 5.3 0 0 1 12 6.3 5.3 5.3 0 0 1 21.8 11c-2.3 4.4-9.8 9-9.8 9Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path d="M9 20H5.5a1.5 1.5 0 0 1-1.5-1.5v-13A1.5 1.5 0 0 1 5.5 4H9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 16.5 20.5 12 16 7.5M20.5 12H9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export { WhatsAppIcon };
