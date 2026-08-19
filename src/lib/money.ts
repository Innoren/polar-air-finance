export function dollarsToCents(value: string | number): number {
  if (typeof value === "number") {
    return Math.round(value * 100);
  }
  const cleaned = value.replace(/[$,\s]/g, "");
  if (!cleaned) return 0;
  const parsed = Number.parseFloat(cleaned);
  if (Number.isNaN(parsed)) return 0;
  return Math.round(parsed * 100);
}

export function formatMoney(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  return `${sign}$${(abs / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function signedFormat(cents: number, kind?: string): string {
  if (kind === "income") return formatMoney(Math.abs(cents));
  return formatMoney(cents);
}
