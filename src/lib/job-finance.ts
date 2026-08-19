import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { jobCosts, jobPayments, jobs, transactions } from "@/db/schema";

export type JobTotals = {
  quoted: number;
  collected: number;
  remaining: number;
  materials: number;
  payroll: number;
  other: number;
  costs: number;
  profit: number;
};

export async function getJobTotals(jobId: string): Promise<JobTotals> {
  const db = getDb();
  const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
  const quoted = job?.quotedAmount ?? 0;

  const [payRow] = await db
    .select({ total: sql<number>`coalesce(sum(${jobPayments.amount}), 0)` })
    .from(jobPayments)
    .where(eq(jobPayments.jobId, jobId));

  const costRows = await db
    .select({
      type: jobCosts.type,
      total: sql<number>`coalesce(sum(${jobCosts.amount}), 0)`,
    })
    .from(jobCosts)
    .where(eq(jobCosts.jobId, jobId))
    .groupBy(jobCosts.type);

  const collected = Number(payRow?.total ?? 0);
  let materials = 0;
  let payroll = 0;
  let other = 0;
  for (const row of costRows) {
    const amount = Number(row.total ?? 0);
    if (row.type === "materials") materials += amount;
    else if (row.type === "payroll") payroll += amount;
    else other += amount;
  }
  const costs = materials + payroll + other;
  return {
    quoted,
    collected,
    remaining: quoted - collected,
    materials,
    payroll,
    other,
    costs,
    profit: collected - costs,
  };
}

export async function syncLinkedJobEntries(transactionId: string) {
  const db = getDb();
  const [txn] = await db
    .select()
    .from(transactions)
    .where(eq(transactions.id, transactionId))
    .limit(1);
  if (!txn) return;

  await db.delete(jobPayments).where(eq(jobPayments.transactionId, transactionId));
  await db.delete(jobCosts).where(eq(jobCosts.transactionId, transactionId));

  if (!txn.jobId || txn.reviewStatus !== "confirmed") return;

  const { categories } = await import("@/db/schema");
  const [category] = txn.categoryId
    ? await db.select().from(categories).where(eq(categories.id, txn.categoryId)).limit(1)
    : [null];
  if (!category || category.kind === "transfer" || category.kind === "ignore") return;

  const date = txn.date;
  const amount = Math.abs(txn.amount);
  const description = txn.merchantName || txn.name;

  if (category.kind === "income") {
    await db.insert(jobPayments).values({
      id: crypto.randomUUID(),
      jobId: txn.jobId,
      amount,
      date,
      method: "bank",
      transactionId,
      notes: description,
    });
    return;
  }

  await db.insert(jobCosts).values({
    id: crypto.randomUUID(),
    jobId: txn.jobId,
    type: category.jobCostType || "other",
    amount,
    date,
    description,
    transactionId,
  });
}

export async function nextJobNumber() {
  const db = getDb();
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(jobs);
  const n = Number(row?.count ?? 0) + 1;
  return `PA-${String(n).padStart(4, "0")}`;
}

export { and, eq };
