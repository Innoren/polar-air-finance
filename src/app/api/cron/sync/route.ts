import { NextResponse } from "next/server";
import { syncAllPlaidItems } from "@/lib/plaid-sync";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await syncAllPlaidItems();
  return NextResponse.json({ ok: true });
}
