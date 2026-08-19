import { NextResponse } from "next/server";
import { syncAllPlaidItems } from "@/lib/plaid-sync";

export async function POST(request: Request) {
  try {
    await request.json();
  } catch {
    // Plaid may send an empty or signed body; still sync.
  }
  await syncAllPlaidItems();
  return NextResponse.json({ ok: true });
}
