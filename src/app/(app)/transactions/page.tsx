import { desc } from "drizzle-orm";
import { createManualTransaction } from "@/actions/transactions";
import { TransactionEditor } from "@/components/transaction-editor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Money } from "@/components/money";
import { Badge } from "@/components/ui/badge";
import { getDb } from "@/db";
import { categories, jobs, transactions } from "@/db/schema";

export default async function TransactionsPage() {
  const db = getDb();
  const [txnRows, categoryRows, jobRows] = await Promise.all([
    db.select().from(transactions).orderBy(desc(transactions.date)),
    db.select().from(categories),
    db.select().from(jobs),
  ]);
  const categoryById = new Map(categoryRows.map((c) => [c.id, c]));
  const jobOptions = jobRows.map((job) => ({
    id: job.id,
    name: `${job.jobNumber} ${job.description}`.trim(),
  }));
  const categoryOptions = categoryRows.map((c) => ({ id: c.id, name: c.name }));
  const inbox = txnRows.filter((t) => t.reviewStatus === "needs_review");
  const today = new Date().toISOString().slice(0, 10);

  function TableBlock({ rows }: { rows: typeof txnRows }) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Payee</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Job</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((txn) => (
            <TableRow key={txn.id}>
              <TableCell>{txn.date.toISOString().slice(0, 10)}</TableCell>
              <TableCell>
                <div>{txn.merchantName || txn.name}</div>
                {txn.pending ? <Badge variant="outline">Pending</Badge> : null}
              </TableCell>
              <TableCell>{categoryById.get(txn.categoryId ?? "")?.name ?? "—"}</TableCell>
              <TableCell>{jobOptions.find((j) => j.id === txn.jobId)?.name ?? "—"}</TableCell>
              <TableCell className="text-right">
                <Money cents={txn.amount} />
              </TableCell>
              <TableCell>
                <TransactionEditor
                  transaction={txn}
                  categories={categoryOptions}
                  jobs={jobOptions}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Transactions</h1>
        <p className="text-sm text-muted-foreground">
          Bank feed and manual entries. Every line can be recategorized, assigned to a job, or confirmed.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manual entry</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createManualTransaction} className="grid gap-3 md:grid-cols-5">
            <Input name="date" type="date" defaultValue={today} />
            <Input name="name" placeholder="Payee" required />
            <Input name="amount" placeholder="Amount (expenses +, income -)" required />
            <select name="categoryId" className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm">
              {categoryRows.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <select name="jobId" className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm">
              <option value="">No job</option>
              {jobOptions.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.name}
                </option>
              ))}
            </select>
            <Button type="submit" className="md:col-span-5 w-fit">
              Add entry
            </Button>
          </form>
        </CardContent>
      </Card>

      <Tabs defaultValue="inbox">
        <TabsList>
          <TabsTrigger value="inbox">Inbox ({inbox.length})</TabsTrigger>
          <TabsTrigger value="all">All ({txnRows.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="inbox">
          <Card>
            <CardContent className="pt-6">
              {inbox.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nothing waiting. Connect a bank in Settings or add a manual entry.</p>
              ) : (
                <TableBlock rows={inbox} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="all">
          <Card>
            <CardContent className="pt-6">
              <TableBlock rows={txnRows} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
