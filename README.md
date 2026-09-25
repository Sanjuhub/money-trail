# Money Trail

A small, private expense tracker built with Next.js, PostgreSQL, and Drizzle ORM. The browser UI communicates with JSON API routes; database and authentication code run only on the server.

## Requirements

- Node.js 20.9 or newer
- PostgreSQL 14 or newer

## Run locally

1. Create a PostgreSQL database named `money_trail` (or choose another name).
2. Copy `.env.example` to `.env` and set `DATABASE_URL` and a long random `SESSION_SECRET` (at least 32 characters).
3. Install packages and apply the checked-in migrations:

   ```sh
   npm install
   npm run db:migrate
   npm run dev
   ```

4. Open `http://localhost:3000` and create an account.
5. To add sample data to an account, use the existing seed command:

   ```sh
   npm install
   npm run db:seed -- you@example.com
   ```

   Replace the email with the account you just created. The seed command adds 60 sample expenses and refuses to run if that account already has ledger transactions, so it will not duplicate or mix with existing data. Refresh the dashboard to see them.

## Features

- Public landing page, email/password registration, login, and logout
- Per-user expenses with description, category, amount, and date
- Monthly total, previous-month comparison, six-month spending graph, category breakdown, and recent expense history
- Edit/delete expenses and choose a display currency (INR is the default)
- 15-minute access JWTs and rotating 30-day refresh JWTs in HTTP-only cookies; refresh tokens are tracked in PostgreSQL, logout revokes the session, and refresh-token reuse revokes its session family
- Income, expenses, transfers, accounts, custom categories and subcategories, payment methods, tags, split shares, and private receipt uploads
- Monthly, weekly, and custom budgets with rollover, utilization, and in-app budget alerts
- Recurring income/expense reminders that require review before a transaction is recorded
- Account balances/net worth, category and income/expense trends, savings rate, largest expenses, and recent activity
- In-app spending trend, unusual expense, low balance, upcoming bill, and budget alerts

The app supports INR, USD, EUR, GBP, CAD, AUD, and JPY for display. Currency selection changes formatting only; it does not convert stored values. Every account and transaction uses the user's selected currency.

The auth signing keys are derived independently from `SESSION_SECRET`, which must contain at least 32 characters. The first request after an access token expires rotates the refresh token and returns the user to the requested page. Existing users can keep their accounts; signing in again creates the new token pair.

## API boundary

The UI uses same-origin JSON requests. Tokens remain in HTTP-only cookies and are never read by browser JavaScript. Route handlers validate requests, authenticate the user, and call server-only services under `src/lib/server`; those services own database access.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/auth/signup` | Create an account and issue tokens |
| `POST` | `/api/auth/login` | Verify credentials and issue tokens |
| `POST` | `/api/auth/logout` | Revoke the token family and clear cookies |
| `POST` | `/api/auth/refresh` | Rotate the refresh token |
| `GET` | `/api/dashboard` | Return the signed-in user’s dashboard data |
| `GET`, `POST` | `/api/transactions` | Search/filter or create income, expense, or transfer entries |
| `PATCH`, `DELETE` | `/api/transactions/:id` | Update or delete an owned transaction |
| `GET`, `POST` | `/api/accounts` | List balances or add a tracked account |
| `PATCH`, `DELETE` | `/api/accounts/:id` | Update or archive an owned account |
| `GET`, `POST` | `/api/categories` | List or add categories/subcategories |
| `PATCH`, `DELETE` | `/api/categories/:id` | Rename or remove an owned custom category |
| `GET`, `POST` | `/api/budgets` | List budget progress or create a budget |
| `PATCH`, `DELETE` | `/api/budgets/:id` | Update or deactivate an owned budget |
| `GET`, `POST` | `/api/recurring` | List due recurring reminders or create a schedule |
| `PATCH`, `DELETE` | `/api/recurring/:id` | Update or pause an owned schedule |
| `POST` | `/api/recurring/occurrences/:id?action=confirm\|skip` | Record or skip a due recurring item |
| `GET`, `PATCH` | `/api/alerts` | Read alerts or mark an alert as read (`?id=...`) |
| `GET` | `/api/analytics` | Return spending/income trends and analytics |
| `POST` | `/api/receipts` | Upload a private receipt (max 5 MB; JPG, PNG, WebP, or PDF) |
| `GET`, `DELETE` | `/api/receipts/:id` | Read or remove an owned receipt through authenticated access |
| `PATCH` | `/api/settings/currency` | Change the signed-in user’s display currency |

## Scheduled checks and receipt storage

Configure `CRON_SECRET` and call `POST /api/cron/daily` with `Authorization: Bearer <CRON_SECRET>` once a day. The endpoint creates idempotent due reminders and checks budget, spending-trend, low-balance, and upcoming-bill alerts. Recurring reminders never initiate external payments; the user confirms or skips each occurrence.

For local development, receipt files are stored under `.data/receipts` and excluded from git. To use an object-storage HTTP gateway, set `RECEIPT_STORAGE_URL` and `RECEIPT_STORAGE_TOKEN`. The gateway must accept authenticated `PUT`, `GET`, and `DELETE` requests at `{base URL}/{user UUID}/{object key}` and keep objects private; receipt bytes are only served through the authenticated app endpoint.

Transfers change account balances but are excluded from income and expense totals. Liability account balances represent the debt amount and are subtracted from assets to calculate net worth. Split amounts must add up to the transaction amount; only shares marked “Me” count toward expense reports and budgets.
