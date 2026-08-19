import { NextResponse } from "next/server";
import { getPlaidClient, PLAID_COUNTRY_CODES, PLAID_PRODUCTS, plaidConfigured } from "@/lib/plaid";
import { requireUser } from "@/lib/session";

export async function POST() {
  await requireUser();
  if (!plaidConfigured()) {
    return NextResponse.json({ error: "Plaid is not configured." }, { status: 400 });
  }
  const client = getPlaidClient();
  const webhook = process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/api/plaid/webhook`
    : undefined;
  const response = await client.linkTokenCreate({
    user: { client_user_id: "polar-air" },
    client_name: "Polar Air Heating & Cooling",
    products: PLAID_PRODUCTS,
    country_codes: PLAID_COUNTRY_CODES,
    language: "en",
    webhook,
  });
  return NextResponse.json({ link_token: response.data.link_token });
}
