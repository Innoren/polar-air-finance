import { desc } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Money } from "@/components/money";
import { getDb } from "@/db";
import { categories, jobs, transactions } from "@/db/schema";
import { getJobTotals } from "@/lib/job-finance";

export default async function ReportsPage() {
  const db = getDb();
  const [cats, txns, jobRows] = await Promise.all([
    db.select().from(categories),
    db.select().from(transactions),
    db.select().from(jobs).orderBy(desc(jobs.createdAt)),
  ]);
  const byId = new Map(cats.map((c) => [c.id, c]));
  const totals = new Map<string, number>();
  for (const txn of txns) {
    if (txn.reviewStatus !== "confirmed") continue;
    const cat = txn.categoryId ? byId.get(txn.categoryId) : undefined;
    if (!cat || cat.kind === "transfer" || cat.kind === "ignore") continue;
    totals.set(cat.id, (totals.get(cat.id) ?? 0) + Math.abs(txn.amount));
  }
  const jobTotals = await Promise.all(
    jobRows.map(async (job) => ({ job, totals: await getJobTotals(job.id) })),
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Reports</h1>
        <p className="text-sm text-muted-foreground">Category spend and job profitability.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>By category</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {cats
            .filter((c) => totals.has(c.id))
            .map((c) => (
              <div key={c.id} className="flex justify-between text-sm">
                <span>{c.name}</span>
                <Money cents={totals.get(c.id) ?? 0} />
              </div>
            ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>By job</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {jobTotals.map(({ job, totals: t }) => (
            <div key={job.id} className="grid grid-cols-5 gap-2 text-sm">
              <span className="col-span-2">
                {job.jobNumber} {job.description}
              </span>
              <span>
                Quoted <Money cents={t.quoted} />
              </span>
              <span>
                Costs <Money cents={t.costs} />
              </span>
              <span>
                Profit <Money cents={t.profit} signed />
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
