"use client";

import { useState } from "react";
import { updateTransaction } from "@/actions/transactions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatMoney } from "@/lib/money";

type Option = { id: string; name: string };

export function TransactionEditor({
  transaction,
  categories,
  jobs,
}: {
  transaction: {
    id: string;
    name: string;
    merchantName: string | null;
    amount: number;
    originalAmount: number;
    amountOverridden: boolean;
    categoryId: string | null;
    jobId: string | null;
    notes: string | null;
    reviewStatus: string;
    originalPlaidCategory: string | null;
  };
  categories: Option[];
  jobs: Option[];
}) {
  const [open, setOpen] = useState(false);
  const [override, setOverride] = useState(transaction.amountOverridden);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex h-7 items-center rounded-lg border border-border px-2.5 text-sm hover:bg-muted">
        Edit
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit transaction</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          {transaction.merchantName || transaction.name}
          {transaction.originalPlaidCategory ? ` · bank category ${transaction.originalPlaidCategory}` : ""}
        </p>
        <form
          action={async (formData) => {
            await updateTransaction(formData);
            setOpen(false);
          }}
          className="grid gap-3"
        >
          <input type="hidden" name="id" value={transaction.id} />
          <div className="space-y-2">
            <Label htmlFor={`category-${transaction.id}`}>Category</Label>
            <select
              id={`category-${transaction.id}`}
              name="categoryId"
              defaultValue={transaction.categoryId ?? "uncategorized"}
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`job-${transaction.id}`}>Job</Label>
            <select
              id={`job-${transaction.id}`}
              name="jobId"
              defaultValue={transaction.jobId ?? ""}
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
            >
              <option value="">None</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`status-${transaction.id}`}>Review</Label>
            <select
              id={`status-${transaction.id}`}
              name="reviewStatus"
              defaultValue={transaction.reviewStatus}
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
            >
              <option value="needs_review">Needs review</option>
              <option value="confirmed">Confirmed</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="amountOverridden"
              value="true"
              checked={override}
              onChange={(e) => setOverride(e.target.checked)}
            />
            Override amount (original bank amount {formatMoney(transaction.originalAmount)} stays stored)
          </label>
          <Input
            name="amount"
            defaultValue={(transaction.amount / 100).toFixed(2)}
            disabled={!override}
          />
          <Textarea name="notes" defaultValue={transaction.notes ?? ""} placeholder="Notes" />
          <Button type="submit">Save changes</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
