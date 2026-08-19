import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { addJobCost, addJobPayment, deleteJobCost, deleteJobPayment, updateJob } from "@/actions/jobs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Money } from "@/components/money";
import { getDb } from "@/db";
import { customers, jobCosts, jobPayments, jobs, transactions } from "@/db/schema";
import { getJobTotals } from "@/lib/job-finance";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = getDb();
  const [job] = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
  if (!job) notFound();
  const [customer] = await db.select().from(customers).where(eq(customers.id, job.customerId)).limit(1);
  const costs = await db.select().from(jobCosts).where(eq(jobCosts.jobId, id));
  const payments = await db.select().from(jobPayments).where(eq(jobPayments.jobId, id));
  const linked = await db.select().from(transactions).where(eq(transactions.jobId, id));
  const totals = await getJobTotals(id);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-muted-foreground">{job.jobNumber}</p>
        <h1 className="text-2xl font-semibold">{job.description || "Job"}</h1>
        <p className="text-sm text-muted-foreground">{customer?.name}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          ["Quoted", totals.quoted],
          ["Collected", totals.collected],
          ["Remaining", totals.remaining],
          ["Costs", totals.costs],
          ["Profit", totals.profit],
        ].map(([label, value]) => (
          <Card key={String(label)}>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <Money className="text-xl font-semibold" cents={Number(value)} signed={label === "Profit"} />
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">
        Materials <Money cents={totals.materials} /> · Payroll <Money cents={totals.payroll} /> · Other{" "}
        <Money cents={totals.other} />
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Job details</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateJob} className="grid gap-3 md:grid-cols-2">
            <input type="hidden" name="id" value={job.id} />
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Work</Label>
              <Input id="description" name="description" defaultValue={job.description} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quotedAmount">Quote ($)</Label>
              <Input
                id="quotedAmount"
                name="quotedAmount"
                defaultValue={(job.quotedAmount / 100).toFixed(2)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                name="status"
                defaultValue={job.status}
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
              >
                {["quoted", "scheduled", "in_progress", "completed", "invoiced", "paid"].map((s) => (
                  <option key={s} value={s}>
                    {s.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" defaultValue={job.notes ?? ""} />
            </div>
            <Button type="submit">Save job</Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Add cost</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form action={addJobCost} className="grid gap-3">
              <input type="hidden" name="jobId" value={job.id} />
              <select name="type" className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm">
                <option value="materials">Materials</option>
                <option value="payroll">Payroll</option>
                <option value="subcontractor">Subcontractor</option>
                <option value="permit">Permit</option>
                <option value="other">Other</option>
              </select>
              <Input name="amount" placeholder="Amount $" required />
              <Input name="date" type="date" defaultValue={today} />
              <Input name="description" placeholder="Description" />
              <Button type="submit">Add cost</Button>
            </form>
            <ul className="space-y-2 text-sm">
              {costs.map((cost) => (
                <li key={cost.id} className="flex items-center justify-between gap-2">
                  <span>
                    {cost.type} · {cost.description}
                  </span>
                  <span className="flex items-center gap-2">
                    <Money cents={cost.amount} />
                    <form action={deleteJobCost}>
                      <input type="hidden" name="id" value={cost.id} />
                      <input type="hidden" name="jobId" value={job.id} />
                      <Button type="submit" size="xs" variant="ghost">
                        Remove
                      </Button>
                    </form>
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add payment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form action={addJobPayment} className="grid gap-3">
              <input type="hidden" name="jobId" value={job.id} />
              <Input name="amount" placeholder="Amount $" required />
              <Input name="date" type="date" defaultValue={today} />
              <Input name="method" placeholder="Check, cash, card, bank" defaultValue="bank" />
              <Input name="notes" placeholder="Notes" />
              <Button type="submit">Add payment</Button>
            </form>
            <ul className="space-y-2 text-sm">
              {payments.map((pay) => (
                <li key={pay.id} className="flex items-center justify-between gap-2">
                  <span>{pay.method}</span>
                  <span className="flex items-center gap-2">
                    <Money cents={pay.amount} />
                    <form action={deleteJobPayment}>
                      <input type="hidden" name="id" value={pay.id} />
                      <input type="hidden" name="jobId" value={job.id} />
                      <Button type="submit" size="xs" variant="ghost">
                        Remove
                      </Button>
                    </form>
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Linked bank lines</CardTitle>
        </CardHeader>
        <CardContent>
          {linked.length === 0 ? (
            <p className="text-sm text-muted-foreground">Assign transactions to this job from the Transactions inbox.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {linked.map((txn) => (
                <li key={txn.id} className="flex justify-between">
                  <span>{txn.merchantName || txn.name}</span>
                  <Money cents={Math.abs(txn.amount)} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
