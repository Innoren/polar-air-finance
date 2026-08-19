"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { jobCosts, jobPayments, jobs } from "@/db/schema";
import { createId } from "@/lib/ids";
import { nextJobNumber } from "@/lib/job-finance";
import { dollarsToCents } from "@/lib/money";
import { requireUser } from "@/lib/session";

export async function createJob(formData: FormData) {
  await requireUser();
  const customerId = String(formData.get("customerId") || "");
  if (!customerId) throw new Error("Pick a customer.");
  const db = getDb();
  const id = createId();
  await db.insert(jobs).values({
    id,
    jobNumber: await nextJobNumber(),
    customerId,
    description: String(formData.get("description") || "").trim(),
    status: String(formData.get("status") || "quoted"),
    quotedAmount: dollarsToCents(String(formData.get("quotedAmount") || "0")),
    notes: String(formData.get("notes") || "").trim() || null,
  });
  revalidatePath("/jobs");
  revalidatePath("/dashboard");
}

export async function updateJob(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") || "");
  const db = getDb();
  await db
    .update(jobs)
    .set({
      description: String(formData.get("description") || "").trim(),
      status: String(formData.get("status") || "quoted"),
      quotedAmount: dollarsToCents(String(formData.get("quotedAmount") || "0")),
      notes: String(formData.get("notes") || "").trim() || null,
      updatedAt: new Date(),
    })
    .where(eq(jobs.id, id));
  revalidatePath(`/jobs/${id}`);
  revalidatePath("/jobs");
  revalidatePath("/dashboard");
}

export async function addJobCost(formData: FormData) {
  await requireUser();
  const jobId = String(formData.get("jobId") || "");
  const db = getDb();
  await db.insert(jobCosts).values({
    id: createId(),
    jobId,
    type: String(formData.get("type") || "other"),
    amount: dollarsToCents(String(formData.get("amount") || "0")),
    date: new Date(String(formData.get("date") || new Date().toISOString())),
    description: String(formData.get("description") || "").trim() || null,
  });
  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/dashboard");
}

export async function addJobPayment(formData: FormData) {
  await requireUser();
  const jobId = String(formData.get("jobId") || "");
  const db = getDb();
  await db.insert(jobPayments).values({
    id: createId(),
    jobId,
    amount: dollarsToCents(String(formData.get("amount") || "0")),
    date: new Date(String(formData.get("date") || new Date().toISOString())),
    method: String(formData.get("method") || "other"),
    notes: String(formData.get("notes") || "").trim() || null,
  });
  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/dashboard");
}

export async function deleteJobCost(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") || "");
  const jobId = String(formData.get("jobId") || "");
  const db = getDb();
  await db.delete(jobCosts).where(eq(jobCosts.id, id));
  revalidatePath(`/jobs/${jobId}`);
}

export async function deleteJobPayment(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") || "");
  const jobId = String(formData.get("jobId") || "");
  const db = getDb();
  await db.delete(jobPayments).where(eq(jobPayments.id, id));
  revalidatePath(`/jobs/${jobId}`);
}
