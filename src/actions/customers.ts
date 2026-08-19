"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { customers } from "@/db/schema";
import { createId } from "@/lib/ids";
import { requireUser } from "@/lib/session";

export async function createCustomer(formData: FormData) {
  await requireUser();
  const name = String(formData.get("name") || "").trim();
  if (!name) throw new Error("Customer name is required.");
  const db = getDb();
  await db.insert(customers).values({
    id: createId(),
    name,
    phone: String(formData.get("phone") || "").trim() || null,
    email: String(formData.get("email") || "").trim() || null,
    address: String(formData.get("address") || "").trim() || null,
    notes: String(formData.get("notes") || "").trim() || null,
  });
  revalidatePath("/customers");
  revalidatePath("/jobs");
}

export async function updateCustomer(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") || "");
  const db = getDb();
  await db
    .update(customers)
    .set({
      name: String(formData.get("name") || "").trim(),
      phone: String(formData.get("phone") || "").trim() || null,
      email: String(formData.get("email") || "").trim() || null,
      address: String(formData.get("address") || "").trim() || null,
      notes: String(formData.get("notes") || "").trim() || null,
      updatedAt: new Date(),
    })
    .where(eq(customers.id, id));
  revalidatePath("/customers");
}
