import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ light = false, compact = false, large = false, animated = false }: { light?: boolean; compact?: boolean; large?: boolean; animated?: boolean }) {
  return (
    <Link
      href="/"
      className={cn("inline-flex", light && "rounded-md bg-white px-2 py-1", animated && "group")}
      aria-label="Engineerparts.com home"
    >
      <Image
        src={animated ? "/engineer-parts-logo-animated.svg" : "/engineer-parts-logo.svg"}
        alt="Engineer Parts"
        width={800}
        height={366}
        className={cn(
          compact ? (large ? "h-12 w-auto" : "h-11 w-auto") : (large ? "h-20 w-auto" : "h-14 w-auto"),
          animated && "motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover:scale-110 motion-safe:group-focus-visible:scale-110",
        )}
      />
    </Link>
  );
}
