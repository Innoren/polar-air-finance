import { createCategory, createInvite, createVendorRule, deleteVendorRule } from "@/actions/settings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getDb } from "@/db";
import { categories, invites, plaidItems, vendorRules } from "@/db/schema";
import { requireUser } from "@/lib/session";
import { plaidConfigured } from "@/lib/plaid";
import { PlaidConnect } from "@/components/plaid-connect";

export default async function SettingsPage() {
  const user = await requireUser();
  const db = getDb();
  const [cats, rules, items, inviteRows] = await Promise.all([
    db.select().from(categories),
    db.select().from(vendorRules),
    db.select().from(plaidItems),
    db.select().from(invites),
  ]);
  const catById = new Map(cats.map((c) => [c.id, c]));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">Bank connection, categories, vendor rules, and office invites.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bank</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {plaidConfigured() ? (
            <>
              <PlaidConnect />
              {items.map((item) => (
                <p key={item.id} className="text-sm">
                  {item.institutionName ?? "Bank"} · {item.status}
                </p>
              ))}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Add PLAID_CLIENT_ID and PLAID_SECRET to .env.local to connect Polar Air’s checking account.
              Until then, use manual entries on the Transactions page.
            </p>
          )}
        </CardContent>
      </Card>

      {user.role === "owner" ? (
        <Card>
          <CardHeader>
            <CardTitle>Invite office staff</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form action={createInvite} className="flex gap-2">
              <Input name="email" type="email" placeholder="office@email.com" required />
              <Button type="submit">Create invite</Button>
            </form>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {inviteRows.map((invite) => (
                <li key={invite.id}>
                  {invite.email} {invite.usedAt ? "(used)" : "· pending — they sign up with this email"}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="grid gap-1 text-sm sm:grid-cols-2">
            {cats.map((c) => (
              <li key={c.id}>
                {c.name} · {c.kind}
              </li>
            ))}
          </ul>
          <form action={createCategory} className="flex flex-wrap gap-2">
            <Input name="name" placeholder="New category" required />
            <select name="kind" className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm">
              <option value="expense">Expense</option>
              <option value="income">Income</option>
              <option value="transfer">Transfer</option>
              <option value="ignore">Ignore</option>
            </select>
            <select name="jobCostType" className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm">
              <option value="">No job cost</option>
              <option value="materials">Materials</option>
              <option value="payroll">Payroll</option>
              <option value="subcontractor">Subcontractor</option>
              <option value="permit">Permit</option>
              <option value="other">Other</option>
            </select>
            <Button type="submit">Add</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vendor rules</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {rules.map((rule) => (
            <form key={rule.id} action={deleteVendorRule} className="flex items-center justify-between text-sm">
              <span>
                “{rule.pattern}” → {catById.get(rule.categoryId)?.name}
              </span>
              <input type="hidden" name="id" value={rule.id} />
              <Button type="submit" size="xs" variant="ghost">
                Remove
              </Button>
            </form>
          ))}
          <form action={createVendorRule} className="flex gap-2">
            <Input name="pattern" placeholder="merchant contains…" required />
            <select name="categoryId" className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm">
              {cats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <Button type="submit">Add rule</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
