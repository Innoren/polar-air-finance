import Link from "next/link";
import { count, isNotNull } from "drizzle-orm";
import { BrandLogo } from "@/components/brand-logo";
import { SignupForm } from "@/components/signup-form";
import { getDb } from "@/db";
import { account } from "@/db/schema";
import { getSessionUser } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function SignupPage() {
  const session = await getSessionUser();
  if (session) redirect("/dashboard");
  const db = getDb();
  const [row] = await db
    .select({ value: count() })
    .from(account)
    .where(isNotNull(account.password));
  const firstUser = Number(row?.value ?? 0) === 0;

  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-border bg-card p-8">
        <BrandLogo className="justify-center" imgClassName="h-16" />
        <div className="space-y-1 text-center">
          <h1 className="text-xl font-semibold">
            {firstUser ? "Set up Polar Air" : "Join the office"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {firstUser
              ? "Create the owner account for Polar Air Heating & Cooling LLC."
              : "Use the invited email address from the owner."}
          </p>
        </div>
        <SignupForm firstUser={firstUser} />
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary underline-offset-4 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
