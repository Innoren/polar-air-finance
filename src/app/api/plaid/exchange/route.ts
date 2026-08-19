import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { plaidAccounts, plaidItems } from "@/db/schema";
import { encryptSecret } from "@/lib/crypto";
import { createId } from "@/lib/ids";
import { getPlaidClient } from "@/lib/plaid";
import { syncPlaidItem } from "@/lib/plaid-sync";
import { requireUser } from "@/lib/session";

export async function POST(request: Request) {
  await requireUser();
  const { publicToken } = (await request.json()) as { publicToken?: string };
  if (!publicToken) {
    return NextResponse.json({ error: "Missing public token." }, { status: 400 });
  }
  const client = getPlaidClient();
  const exchanged = await client.itemPublicTokenExchange({ public_token: publicToken });
  const accessToken = exchanged.data.access_token;
  const itemId = exchanged.data.item_id;
  const accounts = await client.accountsGet({ access_token: accessToken });
  const institutionName = accounts.data.item.institution_id ?? "Linked bank";
  const db = getDb();
  const id = createId();
  await db.insert(plaidItems).values({
    id,
    itemId,
    accessTokenEncrypted: encryptSecret(accessToken),
    institutionId: accounts.data.item.institution_id ?? null,
    institutionName,
  });
  for (const account of accounts.data.accounts) {
    await db.insert(plaidAccounts).values({
      id: createId(),
      itemId: id,
      plaidAccountId: account.account_id,
      name: account.name,
      officialName: account.official_name ?? null,
      mask: account.mask ?? null,
      type: account.type,
      subtype: account.subtype ?? null,
      currentBalance: account.balances.current != null ? Math.round(account.balances.current * 100) : null,
    });
  }
  await syncPlaidItem(id);
  return NextResponse.json({ ok: true });
}
