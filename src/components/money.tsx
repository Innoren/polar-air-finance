import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

export function Money({
  cents,
  className,
  signed,
}: {
  cents: number;
  className?: string;
  signed?: boolean;
}) {
  const tone =
    signed && cents > 0
      ? "text-emerald-400"
      : signed && cents < 0
        ? "text-orange-400"
        : "";
  return <span className={cn("tabular-nums", tone, className)}>{formatMoney(cents)}</span>;
}
