import Link from "next/link";
import { desc } from "drizzle-orm";
import { createCustomer } from "@/actions/customers";
import { createJob } from "@/actions/jobs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Money } from "@/components/money";
import { getDb } from "@/db";
import { customers, jobs } from "@/db/schema";
import { getJobTotals } from "@/lib/job-finance";

export default async function JobsPage() {
  const db = getDb();
  const customerRows = await db.select().from(customers).orderBy(customers.name);
  const jobRows = await db.select().from(jobs).orderBy(desc(jobs.createdAt));
  const customerById = new Map(customerRows.map((c) => [c.id, c]));
  const totals = await Promise.all(jobRows.map(async (job) => [job.id, await getJobTotals(job.id)] as const));
  const totalsById = new Map(totals);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Jobs</h1>
        <p className="text-sm text-muted-foreground">Quote, collect, cost, and profit per job.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>New customer</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createCustomer} className="grid gap-3">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" required />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" name="phone" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Service address</Label>
                <Input id="address" name="address" />
              </div>
              <Button type="submit">Save customer</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>New job</CardTitle>
          </CardHeader>
          <CardContent>
            {customerRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">Add a customer first.</p>
            ) : (
              <form action={createJob} className="grid gap-3">
                <div className="space-y-2">
                  <Label htmlFor="customerId">Customer</Label>
                  <select
                    id="customerId"
                    name="customerId"
                    required
                    className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
                  >
                    {customerRows.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Work</Label>
                  <Input id="description" name="description" placeholder="AC install, furnace repair…" />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="quotedAmount">Quote ($)</Label>
                    <Input id="quotedAmount" name="quotedAmount" inputMode="decimal" placeholder="0.00" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <select
                      id="status"
                      name="status"
                      defaultValue="quoted"
                      className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
                    >
                      <option value="quoted">Quoted</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="in_progress">In progress</option>
                      <option value="completed">Completed</option>
                      <option value="invoiced">Invoiced</option>
                      <option value="paid">Paid</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea id="notes" name="notes" />
                </div>
                <Button type="submit">Create job</Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All jobs</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Quoted</TableHead>
                <TableHead className="text-right">Collected</TableHead>
                <TableHead className="text-right">Costs</TableHead>
                <TableHead className="text-right">Profit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobRows.map((job) => {
                const t = totalsById.get(job.id)!;
                return (
                  <TableRow key={job.id}>
                    <TableCell>
                      <Link href={`/jobs/${job.id}`} className="font-medium hover:underline">
                        {job.jobNumber}
                      </Link>
                      <div className="text-xs text-muted-foreground">{job.description}</div>
                    </TableCell>
                    <TableCell>{customerById.get(job.customerId)?.name}</TableCell>
                    <TableCell className="capitalize">{job.status.replace("_", " ")}</TableCell>
                    <TableCell className="text-right">
                      <Money cents={t.quoted} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Money cents={t.collected} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Money cents={t.costs} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Money cents={t.profit} signed />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
