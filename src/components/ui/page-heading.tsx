export function PageHeading({
  eyebrow,
  title,
  children,
  action,
}: {
  eyebrow?: string;
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="max-w-3xl">
        {eyebrow ? <p className="text-xs font-semibold uppercase text-basil">{eyebrow}</p> : null}
        <h1 className="mt-1 text-2xl font-semibold text-ink md:text-3xl">{title}</h1>
        {children ? <p className="mt-2 text-sm leading-6 text-ink/60">{children}</p> : null}
      </div>
      {action ? <div className="flex items-center gap-2">{action}</div> : null}
    </div>
  );
}
