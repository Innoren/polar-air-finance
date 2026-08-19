"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { auditLog, transactionSplits, transactions } from "@/db/schema";
import { createId } from "@/lib/ids";
import { syncLinkedJobEntries } from "@/lib/job-finance";
import { dollarsToCents } from "@/lib/money";
import { requireUser } from "@/lib/session";

export async function updateTransaction(formData: FormData) {
  const actor = await requireUser();
  const id = String(formData.get("id") || "");
  const db = getDb();
  const [before] = await db.select().from(transactions).where(eq(transactions.id, id)).limit(1);
  if (!before) throw new Error("Transaction not found.");

  const amountRaw = String(formData.get("amount") || "");
  const amountOverridden = Boolean(formData.get("amountOverridden"));
  const amount = amountOverridden ? dollarsToCents(amountRaw) : before.originalAmount;

  await db
    .update(transactions)
    .set({
      categoryId: String(formData.get("categoryId") || "") || null,
      jobId: String(formData.get("jobId") || "") || null,
      notes: String(formData.get("notes") || "").trim() || null,
      reviewStatus: String(formData.get("reviewStatus") || "needs_review"),
      amount,
      amountOverridden,
      updatedAt: new Date(),
    })
    .where(eq(transactions.id, id));

  await db.insert(auditLog).values({
    id: createId(),
    entityType: "transaction",
    entityId: id,
    action: "update",
    userId: actor.id,
    before,
    after: {
      categoryId: String(formData.get("categoryId") || "") || null,
      jobId: String(formData.get("jobId") || "") || null,
      notes: String(formData.get("notes") || "").trim() || null,
      reviewStatus: String(formData.get("reviewStatus") || "needs_review"),
      amount,
    },
  });

  await syncLinkedJobEntries(id);
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  revalidatePath("/jobs");
}

export async function splitTransaction(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") || "");
  const payload = String(formData.get("splits") || "[]");
  const splits = JSON.parse(payload) as Array<{
    categoryId?: string;
    jobId?: string;
    amount: string;
    notes?: string;
  }>;
  const db = getDb();
  await db.delete(transactionSplits).where(eq(transactionSplits.transactionId, id));
  for (const split of splits) {
    await db.insert(transactionSplits).values({
      id: createId(),
      transactionId: id,
      categoryId: split.categoryId || null,
      jobId: split.jobId || null,
      amount: dollarsToCents(split.amount),
      notes: split.notes || null,
    });
  }
  revalidatePath("/transactions");
}

export async function createManualTransaction(formData: FormData) {
  await requireUser();
  const db = getDb();
  const amount = dollarsToCents(String(formData.get("amount") || "0"));
  const id = createId();
  await db.insert(transactions).values({
    id,
    date: new Date(String(formData.get("date") || new Date().toISOString())),
    name: String(formData.get("name") || "").trim() || "Manual entry",
    merchantName: String(formData.get("merchantName") || "").trim() || null,
    originalAmount: amount,
    amount,
    categoryId: String(formData.get("categoryId") || "") || "uncategorized",
    jobId: String(formData.get("jobId") || "") || null,
    notes: String(formData.get("notes") || "").trim() || null,
    reviewStatus: "confirmed",
    source: "manual",
  });
  await syncLinkedJobEntries(id);
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
}
