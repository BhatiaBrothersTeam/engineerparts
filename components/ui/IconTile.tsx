import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function IconTile({
  children,
  tone = "light",
  size = "md",
}: {
  children: ReactNode;
  tone?: "light" | "dark";
  size?: "md" | "lg";
}) {
  return (
    <span
      className={cn(tone === "dark" ? "icon-tile-dark" : "icon-tile", size === "lg" && "h-14 w-14 [&>svg]:h-6 [&>svg]:w-6")}
      aria-hidden="true"
    >
      {children}
    </span>
  );
}
