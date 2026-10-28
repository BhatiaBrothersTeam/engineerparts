export function StatRow({ stats }: { stats: [string, string][] }) {
  if (!stats.length) return null;
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3">
      {stats.map(([value, label]) => (
        <div key={label} className="stat-tile min-w-0 px-3 sm:px-3.5">
          <p className="text-lg font-extrabold text-white sm:text-xl">{value}</p>
          <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-steel-300 sm:text-[11px]">{label}</p>
        </div>
      ))}
    </div>
  );
}
