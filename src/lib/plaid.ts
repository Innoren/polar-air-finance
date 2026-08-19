import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from "plaid";

export function plaidConfigured() {
  return Boolean(process.env.PLAID_CLIENT_ID && process.env.PLAID_SECRET);
}

export function getPlaidClient() {
  if (!plaidConfigured()) {
    throw new Error("Plaid is not configured. Add PLAID_CLIENT_ID and PLAID_SECRET.");
  }
  const env = process.env.PLAID_ENV === "production" ? "production" : process.env.PLAID_ENV === "development" ? "development" : "sandbox";
  return new PlaidApi(
    new Configuration({
      basePath: PlaidEnvironments[env],
      baseOptions: {
        headers: {
          "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID!,
          "PLAID-SECRET": process.env.PLAID_SECRET!,
        },
      },
    }),
  );
}

export const PLAID_PRODUCTS = [Products.Transactions];
export const PLAID_COUNTRY_CODES = [CountryCode.Us];
