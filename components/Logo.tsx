import Image from "next/image";
import Link from "next/link";

export function Logo({ light = false, compact = false, large = false }: { light?: boolean; compact?: boolean; large?: boolean }) {
  return (
    <Link
      href="/"
      className={light ? "inline-flex rounded-md bg-white px-2 py-1" : "inline-flex"}
      aria-label="Engineerparts.com home"
    >
      <Image
        src="/engineer-parts-logo.svg"
        alt="Engineer Parts"
        width={800}
        height={366}
        className={compact ? (large ? "h-12 w-auto" : "h-11 w-auto") : (large ? "h-20 w-auto" : "h-14 w-auto")}
      />
    </Link>
  );
}
