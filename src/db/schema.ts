import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  role: text("role").notNull().default("office"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (t) => [index("session_user_id_idx").on(t.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    issuer: text("issuer").notNull().default("local:credential"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("account_user_id_idx").on(t.userId)],
);

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const invites = pgTable("invites", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  token: text("token").notNull().unique(),
  role: text("role").notNull().default("office"),
  usedAt: timestamp("used_at"),
  createdByUserId: text("created_by_user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
});

export const customers = pgTable("customers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const jobs = pgTable(
  "jobs",
  {
    id: text("id").primaryKey(),
    jobNumber: text("job_number").notNull().unique(),
    customerId: text("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "restrict" }),
    description: text("description").notNull().default(""),
    status: text("status").notNull().default("quoted"),
    quotedAmount: integer("quoted_amount").notNull().default(0),
    scheduledAt: timestamp("scheduled_at"),
    completedAt: timestamp("completed_at"),
    notes: text("notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("jobs_customer_id_idx").on(t.customerId), index("jobs_status_idx").on(t.status)],
);

export const jobCosts = pgTable(
  "job_costs",
  {
    id: text("id").primaryKey(),
    jobId: text("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    amount: integer("amount").notNull(),
    date: timestamp("date").notNull(),
    description: text("description"),
    transactionId: text("transaction_id"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("job_costs_job_id_idx").on(t.jobId)],
);

export const jobPayments = pgTable(
  "job_payments",
  {
    id: text("id").primaryKey(),
    jobId: text("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    amount: integer("amount").notNull(),
    date: timestamp("date").notNull(),
    method: text("method").notNull().default("other"),
    transactionId: text("transaction_id"),
    notes: text("notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("job_payments_job_id_idx").on(t.jobId)],
);

export const categories = pgTable("categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  kind: text("kind").notNull(),
  jobCostType: text("job_cost_type"),
  isSystem: boolean("is_system").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const vendorRules = pgTable("vendor_rules", {
  id: text("id").primaryKey(),
  pattern: text("pattern").notNull(),
  categoryId: text("category_id")
    .notNull()
    .references(() => categories.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const plaidItems = pgTable("plaid_items", {
  id: text("id").primaryKey(),
  itemId: text("item_id").notNull().unique(),
  accessTokenEncrypted: text("access_token_encrypted").notNull(),
  institutionId: text("institution_id"),
  institutionName: text("institution_name"),
  cursor: text("cursor"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const plaidAccounts = pgTable(
  "plaid_accounts",
  {
    id: text("id").primaryKey(),
    itemId: text("item_id")
      .notNull()
      .references(() => plaidItems.id, { onDelete: "cascade" }),
    plaidAccountId: text("plaid_account_id").notNull().unique(),
    name: text("name").notNull(),
    officialName: text("official_name"),
    mask: text("mask"),
    type: text("type"),
    subtype: text("subtype"),
    currentBalance: integer("current_balance"),
  },
  (t) => [index("plaid_accounts_item_id_idx").on(t.itemId)],
);

export const transactions = pgTable(
  "transactions",
  {
    id: text("id").primaryKey(),
    plaidTransactionId: text("plaid_transaction_id").unique(),
    accountId: text("account_id").references(() => plaidAccounts.id, {
      onDelete: "set null",
    }),
    date: timestamp("date").notNull(),
    name: text("name").notNull(),
    merchantName: text("merchant_name"),
    originalAmount: integer("original_amount").notNull(),
    amount: integer("amount").notNull(),
    amountOverridden: boolean("amount_overridden").notNull().default(false),
    originalPlaidCategory: text("original_plaid_category"),
    categoryId: text("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    jobId: text("job_id").references(() => jobs.id, { onDelete: "set null" }),
    notes: text("notes"),
    reviewStatus: text("review_status").notNull().default("needs_review"),
    pending: boolean("pending").notNull().default(false),
    source: text("source").notNull().default("plaid"),
    raw: jsonb("raw"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("transactions_date_idx").on(t.date),
    index("transactions_review_idx").on(t.reviewStatus),
    index("transactions_category_idx").on(t.categoryId),
    index("transactions_job_idx").on(t.jobId),
  ],
);

export const transactionSplits = pgTable(
  "transaction_splits",
  {
    id: text("id").primaryKey(),
    transactionId: text("transaction_id")
      .notNull()
      .references(() => transactions.id, { onDelete: "cascade" }),
    categoryId: text("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    jobId: text("job_id").references(() => jobs.id, { onDelete: "set null" }),
    amount: integer("amount").notNull(),
    notes: text("notes"),
  },
  (t) => [index("transaction_splits_txn_idx").on(t.transactionId)],
);

export const auditLog = pgTable(
  "audit_log",
  {
    id: text("id").primaryKey(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    action: text("action").notNull(),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    before: jsonb("before"),
    after: jsonb("after"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("audit_log_entity_idx").on(t.entityType, t.entityId),
    uniqueIndex("audit_log_id_idx").on(t.id),
  ],
);
