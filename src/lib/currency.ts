import type { Currency, Locale } from "@/types/hris";
import { formatCurrency, FX_TO_USD } from "./payroll-engine";

export const ALL_CURRENCIES: Currency[] = ["IDR", "USD", "SGD", "EUR", "GBP"];

export const CURRENCY_META: Record<
  Currency,
  { symbol: string; flag: string; label: { id: string; en: string } }
> = {
  IDR: {
    symbol: "Rp",
    flag: "🇮🇩",
    label: { id: "IDR · Rupiah Indonesia", en: "IDR · Indonesian Rupiah" },
  },
  USD: {
    symbol: "$",
    flag: "🇺🇸",
    label: { id: "USD · Dolar AS", en: "USD · US Dollar" },
  },
  SGD: {
    symbol: "S$",
    flag: "🇸🇬",
    label: { id: "SGD · Dolar Singapura", en: "SGD · Singapore Dollar" },
  },
  EUR: {
    symbol: "€",
    flag: "🇪🇺",
    label: { id: "EUR · Euro Eropa", en: "EUR · Euro" },
  },
  GBP: {
    symbol: "£",
    flag: "🇬🇧",
    label: { id: "GBP · Poundsterling Inggris", en: "GBP · British Pound" },
  },
};

/**
 * Deterministically converts an amount from `from` currency into `to` currency
 * using the canonical FX_TO_USD table so SSR and CSR always match 100%.
 */
export function convertCurrency(
  amount: number,
  from: Currency,
  to: Currency
): number {
  if (from === to) return Math.round(amount);
  const inUsd = amount * (FX_TO_USD[from] || 1);
  const targetRate = FX_TO_USD[to] || 1;
  const converted = inUsd / targetRate;
  return to === "IDR" ? Math.round(converted / 100) * 100 : Math.round(converted);
}

/**
 * Formats an amount originally denominated in `from` currency into the user's
 * active `displayCurrency`.
 */
export function formatConverted(
  amount: number,
  from: Currency,
  displayCurrency: Currency
): string {
  return formatCurrency(convertCurrency(amount, from, displayCurrency), displayCurrency);
}

/**
 * Compact executive KPI formatter (deterministic across Node & Browser ICU)
 * e.g. IDR 742,500,000 -> "Rp 742,5 Jt" (id) / "Rp 742.5M" (en), USD 45,890 -> "$45.9K"
 */
export function formatCompactConverted(
  amountInUsd: number,
  displayCurrency: Currency,
  locale: Locale
): string {
  const val = convertCurrency(amountInUsd, "USD", displayCurrency);
  const sym = CURRENCY_META[displayCurrency].symbol;
  if (displayCurrency === "IDR") {
    if (val >= 1_000_000_000) {
      const m = (val / 1_000_000_000).toFixed(2);
      return locale === "id" ? `Rp ${m.replace(".", ",")} M` : `Rp ${m}B`;
    }
    if (val >= 1_000_000) {
      const jt = (val / 1_000_000).toFixed(1);
      return locale === "id" ? `Rp ${jt.replace(".", ",")} Jt` : `Rp ${jt}M`;
    }
    return formatCurrency(val, "IDR");
  }
  if (val >= 1_000_000) {
    return `${sym}${(val / 1_000_000).toFixed(2)}M`;
  }
  if (val >= 1_000) {
    return `${sym}${(val / 1_000).toFixed(1)}K`;
  }
  return formatCurrency(val, displayCurrency);
}
