export function StatRow({ stats }: { stats: [string, string][] }) {
  if (!stats.length) return null;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {stats.map(([value, label]) => (
        <div key={label} className="stat-tile">
          <p className="text-lg font-extrabold text-white sm:text-xl">{value}</p>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-steel-300">{label}</p>
        </div>
      ))}
    </div>
  );
}
