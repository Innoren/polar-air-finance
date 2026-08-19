import { desc, sql } from "drizzle-orm";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Money } from "@/components/money";
import { getDb } from "@/db";
import { categories, jobs, jobPayments, transactions } from "@/db/schema";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function DashboardPage() {
  const db = getDb();
  const yearStart = new Date(new Date().getFullYear(), 0, 1);

  const categoryRows = await db.select().from(categories);
  const byId = new Map(categoryRows.map((c) => [c.id, c]));

  const txns = await db
    .select()
    .from(transactions)
    .where(sql`${transactions.date} >= ${yearStart}`);

  let income = 0;
  let materials = 0;
  let payroll = 0;
  let otherExpense = 0;
  let needsReview = 0;
  for (const txn of txns) {
    if (txn.reviewStatus === "needs_review") needsReview += 1;
    if (txn.reviewStatus !== "confirmed") continue;
    const cat = txn.categoryId ? byId.get(txn.categoryId) : undefined;
    if (!cat || cat.kind === "transfer" || cat.kind === "ignore") continue;
    const abs = Math.abs(txn.amount);
    if (cat.kind === "income") income += abs;
    else if (cat.jobCostType === "materials" || cat.id === "materials") materials += abs;
    else if (cat.jobCostType === "payroll" || cat.id === "payroll") payroll += abs;
    else otherExpense += abs;
  }
  const cashProfit = income - materials - payroll - otherExpense;

  const [quotedRow] = await db
    .select({ total: sql<number>`coalesce(sum(${jobs.quotedAmount}), 0)` })
    .from(jobs);
  const [collectedRow] = await db
    .select({ total: sql<number>`coalesce(sum(${jobPayments.amount}), 0)` })
    .from(jobPayments);
  const recentJobs = await db.select().from(jobs).orderBy(desc(jobs.createdAt)).limit(6);

  const cards = [
    { label: "YTD collected (bank)", value: income },
    { label: "Materials", value: materials },
    { label: "Payroll", value: payroll },
    { label: "Other expenses", value: otherExpense },
    { label: "Cash profit", value: cashProfit, signed: true },
    { label: "Jobs quoted", value: Number(quotedRow?.total ?? 0) },
    { label: "Jobs collected", value: Number(collectedRow?.total ?? 0) },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Polar Air Heating & Cooling LLC · {new Date().getFullYear()}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/jobs" className={cn(buttonVariants())}>
            New job
          </Link>
          <Link href="/transactions" className={cn(buttonVariants({ variant: "outline" }))}>
            Review inbox {needsReview ? `(${needsReview})` : ""}
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <Money className="text-2xl font-semibold" cents={card.value} signed={card.signed} />
            </CardContent>
          </Card>
        ))}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Needs review</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{needsReview}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent jobs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {recentJobs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No jobs yet. Create a customer, then a job.</p>
          ) : (
            recentJobs.map((job) => (
              <Link
                key={job.id}
                href={`/jobs/${job.id}`}
                className="flex items-center justify-between rounded-lg border border-border px-3 py-2 hover:bg-muted/40"
              >
                <span>
                  {job.jobNumber} · {job.description || "Job"}
                </span>
                <span className="text-sm capitalize text-muted-foreground">{job.status.replace("_", " ")}</span>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
