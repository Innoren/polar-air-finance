import { getDb } from "@/db";
import {
  categories,
  vendorRules,
} from "@/db/schema";

const CATEGORY_SEED = [
  { id: "job-income", name: "Job Income", kind: "income", jobCostType: null, sortOrder: 10 },
  { id: "materials", name: "Materials", kind: "expense", jobCostType: "materials", sortOrder: 20 },
  { id: "payroll", name: "Payroll", kind: "expense", jobCostType: "payroll", sortOrder: 30 },
  { id: "subcontractor", name: "Subcontractor", kind: "expense", jobCostType: "subcontractor", sortOrder: 40 },
  { id: "permits", name: "Permits", kind: "expense", jobCostType: "permit", sortOrder: 50 },
  { id: "fuel", name: "Fuel", kind: "expense", jobCostType: null, sortOrder: 60 },
  { id: "insurance", name: "Insurance", kind: "expense", jobCostType: null, sortOrder: 70 },
  { id: "utilities", name: "Utilities", kind: "expense", jobCostType: null, sortOrder: 80 },
  { id: "equipment", name: "Equipment", kind: "expense", jobCostType: null, sortOrder: 90 },
  { id: "advertising", name: "Advertising", kind: "expense", jobCostType: null, sortOrder: 100 },
  { id: "other-expense", name: "Other Expense", kind: "expense", jobCostType: "other", sortOrder: 110 },
  { id: "owner-draw", name: "Owner Draw", kind: "ignore", jobCostType: null, sortOrder: 120 },
  { id: "transfer", name: "Transfer", kind: "transfer", jobCostType: null, sortOrder: 130 },
  { id: "uncategorized", name: "Uncategorized", kind: "expense", jobCostType: null, sortOrder: 999 },
] as const;

const RULE_SEED = [
  { pattern: "ferguson", categoryId: "materials" },
  { pattern: "johnstone", categoryId: "materials" },
  { pattern: "home depot", categoryId: "materials" },
  { pattern: "homedepot", categoryId: "materials" },
  { pattern: "lowe's", categoryId: "materials" },
  { pattern: "lowes", categoryId: "materials" },
  { pattern: "supply house", categoryId: "materials" },
  { pattern: "adp", categoryId: "payroll" },
  { pattern: "gusto", categoryId: "payroll" },
  { pattern: "payroll", categoryId: "payroll" },
  { pattern: "intuit", categoryId: "payroll" },
  { pattern: "shell", categoryId: "fuel" },
  { pattern: "exxon", categoryId: "fuel" },
  { pattern: "chevron", categoryId: "fuel" },
  { pattern: "sunoco", categoryId: "fuel" },
  { pattern: "wawa", categoryId: "fuel" },
];

async function seed() {
  const db = getDb();
  for (const row of CATEGORY_SEED) {
    await db
      .insert(categories)
      .values({
        id: row.id,
        name: row.name,
        kind: row.kind,
        jobCostType: row.jobCostType,
        isSystem: true,
        sortOrder: row.sortOrder,
      })
      .onConflictDoNothing();
  }
  for (const rule of RULE_SEED) {
    await db
      .insert(vendorRules)
      .values({
        id: `rule-${rule.pattern.replace(/[^a-z0-9]+/g, "-")}`,
        pattern: rule.pattern,
        categoryId: rule.categoryId,
      })
      .onConflictDoNothing();
  }
  console.log("Seeded HVAC categories and vendor rules.");
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
