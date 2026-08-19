import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { categories, vendorRules } from "@/db/schema";

export type CategoryRecord = typeof categories.$inferSelect;

const PLAID_MAP: Record<string, string> = {
  INCOME: "job-income",
  PAYROLL: "payroll",
  GENERAL_MERCHANDISE: "materials",
  GENERAL_SERVICES: "other-expense",
  HOME_IMPROVEMENT: "materials",
  RENT_AND_UTILITIES: "utilities",
  TRANSPORTATION: "fuel",
  GOVERNMENT_AND_NON_PROFIT: "permits",
  BANK_FEES: "other-expense",
  TRANSFER_IN: "transfer",
  TRANSFER_OUT: "transfer",
  LOAN_PAYMENTS: "other-expense",
};

export async function categorizeTransaction(input: {
  name: string;
  merchantName?: string | null;
  plaidCategory?: string | null;
}): Promise<{ categoryId: string; reviewStatus: "needs_review" | "confirmed" }> {
  const db = getDb();
  const haystack = `${input.merchantName ?? ""} ${input.name}`.toLowerCase();
  const rules = await db.select().from(vendorRules);
  for (const rule of rules) {
    if (haystack.includes(rule.pattern.toLowerCase())) {
      return { categoryId: rule.categoryId, reviewStatus: "needs_review" };
    }
  }

  const primary = (input.plaidCategory ?? "").split(".")[0]?.toUpperCase();
  const mapped = primary ? PLAID_MAP[primary] : undefined;
  if (mapped) {
    const [row] = await db.select().from(categories).where(eq(categories.id, mapped)).limit(1);
    if (row) return { categoryId: row.id, reviewStatus: "needs_review" };
  }

  return { categoryId: "uncategorized", reviewStatus: "needs_review" };
}
