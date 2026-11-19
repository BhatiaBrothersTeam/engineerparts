export function HeartIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
      <path d="M12 20s-7.5-4.6-9.8-9A5.3 5.3 0 0 1 12 6.3 5.3 5.3 0 0 1 21.8 11c-2.3 4.4-9.8 9-9.8 9Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
