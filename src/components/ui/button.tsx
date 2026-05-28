import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const variants: Record<ButtonVariant, string> = {
  primary: "bg-ink text-white hover:bg-ink/90 disabled:bg-ink/40",
  secondary:
    "border border-ink/12 bg-white/70 text-ink hover:border-ink/20 hover:bg-white disabled:text-ink/40",
  ghost: "text-ink hover:bg-ink/6 disabled:text-ink/40",
  danger: "bg-wine text-white hover:bg-wine/90 disabled:bg-wine/40",
};

export function Button({ className, variant = "secondary", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium transition focus-visible:focus-ring disabled:opacity-70",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
