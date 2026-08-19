"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { categories, invites, vendorRules } from "@/db/schema";
import { createId } from "@/lib/ids";
import { requireOwner, requireUser } from "@/lib/session";

export async function createInvite(formData: FormData) {
  const owner = await requireOwner();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  if (!email) throw new Error("Email is required.");
  const token = createId().replace(/-/g, "").slice(0, 12);
  const db = getDb();
  await db.insert(invites).values({
    id: createId(),
    email,
    token,
    role: "office",
    createdByUserId: owner.id,
    expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
  });
  revalidatePath("/settings");
}

export async function createCategory(formData: FormData) {
  await requireUser();
  const name = String(formData.get("name") || "").trim();
  if (!name) throw new Error("Name is required.");
  const db = getDb();
  await db.insert(categories).values({
    id: createId(),
    name,
    kind: String(formData.get("kind") || "expense"),
    jobCostType: String(formData.get("jobCostType") || "") || null,
    isSystem: false,
    sortOrder: 200,
  });
  revalidatePath("/settings");
  revalidatePath("/transactions");
}

export async function createVendorRule(formData: FormData) {
  await requireUser();
  const db = getDb();
  await db.insert(vendorRules).values({
    id: createId(),
    pattern: String(formData.get("pattern") || "").trim().toLowerCase(),
    categoryId: String(formData.get("categoryId") || ""),
  });
  revalidatePath("/settings");
}

export async function deleteVendorRule(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") || "");
  const db = getDb();
  await db.delete(vendorRules).where(eq(vendorRules.id, id));
  revalidatePath("/settings");
}
