import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { plaidAccounts, plaidItems, transactions } from "@/db/schema";
import { categorizeTransaction } from "@/lib/categorize";
import { decryptSecret } from "@/lib/crypto";
import { createId } from "@/lib/ids";
import { getPlaidClient } from "@/lib/plaid";
import { RemovedTransaction, Transaction } from "plaid";

function toCents(amount: number) {
  return Math.round(amount * 100);
}

export async function syncPlaidItem(itemRowId: string) {
  const db = getDb();
  const [item] = await db.select().from(plaidItems).where(eq(plaidItems.id, itemRowId)).limit(1);
  if (!item) return;
  const client = getPlaidClient();
  const accessToken = decryptSecret(item.accessTokenEncrypted);
  let cursor = item.cursor || undefined;
  let added: Transaction[] = [];
  let modified: Transaction[] = [];
  let removed: RemovedTransaction[] = [];
  let hasMore = true;
  while (hasMore) {
    const response = await client.transactionsSync({
      access_token: accessToken,
      cursor,
    });
    added = added.concat(response.data.added);
    modified = modified.concat(response.data.modified);
    removed = removed.concat(response.data.removed);
    hasMore = response.data.has_more;
    cursor = response.data.next_cursor;
  }

  async function upsert(txn: Transaction) {
    const account = (
      await db.select().from(plaidAccounts).where(eq(plaidAccounts.plaidAccountId, txn.account_id)).limit(1)
    )[0];
    const suggestion = await categorizeTransaction({
      name: txn.name,
      merchantName: txn.merchant_name,
      plaidCategory: txn.personal_finance_category?.primary ?? txn.personal_finance_category?.detailed,
    });
    const existing = (
      await db
        .select()
        .from(transactions)
        .where(eq(transactions.plaidTransactionId, txn.transaction_id))
        .limit(1)
    )[0];
    const cents = toCents(txn.amount);
    if (existing) {
      await db
        .update(transactions)
        .set({
          date: new Date(txn.date),
          name: txn.name,
          merchantName: txn.merchant_name ?? null,
          originalAmount: cents,
          amount: existing.amountOverridden ? existing.amount : cents,
          pending: txn.pending,
          originalPlaidCategory: txn.personal_finance_category?.primary ?? null,
          raw: txn as unknown as Record<string, unknown>,
          updatedAt: new Date(),
        })
        .where(eq(transactions.id, existing.id));
      return;
    }
    await db.insert(transactions).values({
      id: createId(),
      plaidTransactionId: txn.transaction_id,
      accountId: account?.id ?? null,
      date: new Date(txn.date),
      name: txn.name,
      merchantName: txn.merchant_name ?? null,
      originalAmount: cents,
      amount: cents,
      originalPlaidCategory: txn.personal_finance_category?.primary ?? null,
      categoryId: suggestion.categoryId,
      reviewStatus: suggestion.reviewStatus,
      pending: txn.pending,
      source: "plaid",
      raw: txn as unknown as Record<string, unknown>,
    });
  }

  for (const txn of added) await upsert(txn);
  for (const txn of modified) await upsert(txn);
  for (const gone of removed) {
    if (gone.transaction_id) {
      await db.delete(transactions).where(eq(transactions.plaidTransactionId, gone.transaction_id));
    }
  }

  await db
    .update(plaidItems)
    .set({ cursor: cursor ?? item.cursor, updatedAt: new Date() })
    .where(eq(plaidItems.id, item.id));
}

export async function syncAllPlaidItems() {
  const db = getDb();
  const items = await db.select().from(plaidItems);
  for (const item of items) {
    await syncPlaidItem(item.id);
  }
}
