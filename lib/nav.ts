export interface NavItem {
  label: string;
  href: string;
  children?: { label: string; href: string; description?: string }[];
}

export const primaryNav: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Clearance Stock", href: "/clearance" },
  { label: "Brands", href: "/brands" },
  { label: "New Arrivals", href: "/recently-added" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];
