import type { CurrencyCode } from "@/lib/types";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function currency(value: number, currencyCode: CurrencyCode = "USD") {
  return new Intl.NumberFormat("fr-CD", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: currencyCode === "CDF" ? 0 : 2,
  }).format(value);
}

export function convertCurrency(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode,
  cdfPerUsd: number,
) {
  if (from === to) return amount;
  if (from === "USD") return amount * cdfPerUsd;
  return amount / cdfPerUsd;
}

export function percent(value: number) {
  return new Intl.NumberFormat("fr-CD", {
    style: "percent",
    maximumFractionDigits: 0,
  }).format(value);
}

export function initials(firstName?: string, lastName?: string) {
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "M";
}

export function titleCase(value: string) {
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}
