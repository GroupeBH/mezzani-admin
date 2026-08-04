import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const variants: Record<ButtonVariant, string> = {
  primary: "bg-success text-white shadow-sm hover:bg-emerald-600 active:scale-[0.97] disabled:bg-success/45",
  secondary:
    "border border-border bg-surface text-primary hover:border-border-strong hover:bg-surface-pressed disabled:text-text-disabled",
  ghost: "text-primary hover:bg-surface-pressed disabled:text-text-disabled",
  danger: "bg-danger text-white hover:bg-red-600 active:scale-[0.97] disabled:bg-danger/45",
};

export function Button({ className, variant = "secondary", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex h-9 items-center justify-center gap-2 rounded-md px-3 text-sm font-semibold transition duration-100 focus-visible:focus-ring disabled:opacity-70",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
