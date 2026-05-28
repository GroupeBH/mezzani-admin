import { cn } from "@/lib/utils";

const variants = {
  ok: "bg-basil/10 text-basil ring-basil/20",
  warn: "bg-saffron/18 text-[#7a560c] ring-saffron/35",
  danger: "bg-wine/10 text-wine ring-wine/20",
  neutral: "bg-ink/7 text-ink/70 ring-ink/10",
  info: "bg-clay/12 text-clay ring-clay/20",
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
        "inline-flex h-7 items-center rounded-full px-2.5 text-xs font-medium ring-1",
        variants[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
