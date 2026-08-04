import { cn } from "@/lib/utils";

const variants = {
  ok: "bg-success-light text-emerald-700 ring-success/20",
  warn: "bg-warning-light text-amber-700 ring-warning/25",
  danger: "bg-danger-light text-danger ring-danger/20",
  neutral: "bg-surface-pressed text-text-secondary ring-border",
  info: "bg-info-light text-info ring-info/20",
};

export function StatusPill({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: keyof typeof variants;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-full px-2.5 text-xs font-medium ring-1",
        variants[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
