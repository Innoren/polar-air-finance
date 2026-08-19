# Polar Air Heating & Cooling — Finance Tracker

Internal books for Polar Air Heating & Cooling LLC: jobs, quotes, materials, payroll, profit, and a bank feed.

## Run locally

```bash
npm install
npm run db:push
npm run db:seed
npm run dev
```

Open http://localhost:3000. The first sign-up becomes the owner. Invite office staff from Settings.

## Bank connection

Add `PLAID_CLIENT_ID` and `PLAID_SECRET` to `.env.local`, then use **Settings → Connect bank**. Until then, add income and expenses manually on Transactions.

The Polar Air logo in `public/logo.png` is used as-is. Do not recolor, crop, or invert it.
