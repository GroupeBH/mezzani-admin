import { AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function LoadingState({ label = "Chargement" }: { label?: string }) {
  return (
    <div className="flex min-h-32 items-center justify-center gap-2 text-sm text-ink/60">
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      {label}
    </div>
  );
}

export function EmptyState({ title, detail }: { title: string; detail?: string }) {
  return (
    <div className="flex min-h-32 flex-col items-center justify-center px-4 text-center">
      <p className="text-sm font-medium text-ink">{title}</p>
      {detail ? <p className="mt-1 max-w-sm text-sm text-ink/58">{detail}</p> : null}
    </div>
  );
}

export function ErrorState({ title = "API indisponible", detail }: { title?: string; detail?: string }) {
  return (
    <div className="flex min-h-32 flex-col items-center justify-center px-4 text-center text-wine">
      <AlertTriangle className="mb-2 h-5 w-5" aria-hidden="true" />
      <p className="text-sm font-semibold">{title}</p>
      {detail ? <p className="mt-1 max-w-sm text-sm text-wine/70">{detail}</p> : null}
    </div>
  );
}

export function Field({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { className?: string }) {
  return (
    <input
      className={cn(
        "h-10 rounded-md border border-ink/12 bg-white px-3 text-sm text-ink outline-none transition placeholder:text-ink/35 focus:border-basil focus:ring-2 focus:ring-basil/20",
        className,
      )}
      {...props}
    />
  );
}

export function Select({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { className?: string }) {
  return (
    <select
      className={cn(
        "h-10 rounded-md border border-ink/12 bg-white px-3 text-sm text-ink outline-none transition focus:border-basil focus:ring-2 focus:ring-basil/20",
        className,
      )}
      {...props}
    />
  );
}
