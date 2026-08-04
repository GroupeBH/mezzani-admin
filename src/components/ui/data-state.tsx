import { AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function LoadingState({ label = "Chargement" }: { label?: string }) {
  return (
    <div className="flex min-h-32 items-center justify-center gap-2 text-sm text-text-secondary">
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      {label}
    </div>
  );
}

export function EmptyState({ title, detail }: { title: string; detail?: string }) {
  return (
    <div className="flex min-h-32 flex-col items-center justify-center px-4 text-center">
      <p className="text-sm font-medium text-primary">{title}</p>
      {detail ? <p className="mt-1 max-w-sm text-sm text-text-secondary">{detail}</p> : null}
    </div>
  );
}

export function ErrorState({ title = "API indisponible", detail }: { title?: string; detail?: string }) {
  return (
    <div className="flex min-h-32 flex-col items-center justify-center px-4 text-center text-danger">
      <AlertTriangle className="mb-2 h-5 w-5" aria-hidden="true" />
      <p className="text-sm font-semibold">{title}</p>
      {detail ? <p className="mt-1 max-w-sm text-sm text-danger/70">{detail}</p> : null}
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
        "h-10 rounded-md border border-border bg-surface px-3 text-sm text-primary outline-none transition placeholder:text-text-disabled focus:border-info focus:shadow-focus",
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
        "h-10 rounded-md border border-border bg-surface px-3 text-sm text-primary outline-none transition focus:border-info focus:shadow-focus",
        className,
      )}
      {...props}
    />
  );
}
