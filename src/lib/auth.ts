import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { eq, isNotNull } from "drizzle-orm";
import { getDb } from "@/db";
import { account, invites, user } from "@/db/schema";
import * as schema from "@/db/schema";

function authSecret() {
  return process.env.BETTER_AUTH_SECRET || process.env.DATABASE_URL || "polar-air-dev-secret";
}

export const auth = betterAuth({
  secret: authSecret(),
  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  trustedOrigins: [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:3002",
  ],
  database: drizzleAdapter(getDb(), {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "office",
        input: false,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (data) => {
          const db = getDb();
          const email = data.email.toLowerCase();
          const [existingSame] = await db.select().from(user).where(eq(user.email, email)).limit(1);
          if (existingSame) {
            const [existingAccount] = await db
              .select()
              .from(account)
              .where(eq(account.userId, existingSame.id))
              .limit(1);
            if (!existingAccount?.password) {
              await db.delete(account).where(eq(account.userId, existingSame.id));
              await db.delete(schema.session).where(eq(schema.session.userId, existingSame.id));
              await db.delete(user).where(eq(user.id, existingSame.id));
              return { data: { ...data, role: "owner" } };
            }
          }

          const [passworded] = await db
            .select({ id: account.id })
            .from(account)
            .where(isNotNull(account.password))
            .limit(1);
          if (!passworded) {
            return { data: { ...data, role: "owner" } };
          }

          const inviteRows = await db.select().from(invites).where(eq(invites.email, email));
          const invite = inviteRows.find(
            (row) => !row.usedAt && row.expiresAt.getTime() > Date.now(),
          );
          if (!invite) {
            throw new Error("An invite is required to create an account.");
          }
          return { data: { ...data, role: invite.role } };
        },
        after: async (created) => {
          const db = getDb();
          await db
            .update(invites)
            .set({ usedAt: new Date() })
            .where(eq(invites.email, created.email.toLowerCase()));
        },
      },
    },
  },
  plugins: [nextCookies()],
});

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: "owner" | "office";
};
