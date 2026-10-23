export function AccountSectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-6 sm:mb-7">
      <p className="eyebrow text-brand-700">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-extrabold text-navy-950">{title}</h2>
      {description ? (
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-steel-600">{description}</p>
      ) : null}
    </div>
  );
}
