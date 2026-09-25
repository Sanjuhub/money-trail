import "dotenv/config";
import { count, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { accounts, categories, transactions, users } from "../src/lib/db/schema";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

const entries = [
  { day: 2, description: "Coffee and breakfast", category: "Food", amount: 280 },
  { day: 4, description: "Metro card top-up", category: "Transport", amount: 500 },
  { day: 6, description: "Lunch", category: "Food", amount: 420 },
  { day: 9, description: "Internet bill", category: "Bills", amount: 1199 },
  { day: 12, description: "Market essentials", category: "Shopping", amount: 1850 },
  { day: 15, description: "Dinner with friends", category: "Food", amount: 980 },
  { day: 18, description: "Pharmacy", category: "Health", amount: 360 },
  { day: 21, description: "Cab ride", category: "Transport", amount: 340 },
  { day: 24, description: "Movie tickets", category: "Entertainment", amount: 720 },
  { day: 27, description: "Household supplies", category: "Shopping", amount: 940 },
] as const;

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) {
    throw new Error("Pass the account email to seed, for example: npm run db:seed -- you@example.com");
  }

  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (!user) throw new Error(`No Money Trail account found for ${email}. Create the account first.`);
  const [cash] = await db.select({ id: accounts.id }).from(accounts).where(eq(accounts.userId, user.id)).limit(1);
  if (!cash) throw new Error("No account found for this user. Sign in once to initialize the account.");
  const categoryRows = await db.select({ id: categories.id, name: categories.name }).from(categories).where(eq(categories.userId, user.id));

  const [existing] = await db.select({ value: count() }).from(transactions).where(eq(transactions.userId, user.id));
  if (Number(existing.value) > 0) {
    throw new Error("This account already has expenses. No sample rows were added.");
  }

  const now = new Date();
  const records = Array.from({ length: 6 }, (_, index) => {
    const offset = index - 5;
    const month = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offset, 1));
    const daysInMonth = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 0)).getUTCDate();
    const lastAvailableDay = offset === 0 ? Math.min(daysInMonth, now.getUTCDate()) : daysInMonth;

    return entries.map((entry, entryIndex) => {
      const day = Math.min(entry.day, lastAvailableDay);
      const date = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), day));
      const variation = ((index * 37 + entryIndex * 19) % 31) - 15;
      const amount = Math.max(50, entry.amount + variation * 10);
      return {
        userId: user.id,
        type: "expense",
        description: entry.description,
        category: entry.category,
        categoryId: categoryRows.find((category) => category.name === entry.category)?.id ?? null,
        amount: amount.toFixed(2),
        transactionDate: date.toISOString().slice(0, 10),
        paymentMethod: "cash",
        accountId: cash.id,
      };
    });
  }).flat();

  await db.insert(transactions).values(records);
  console.log(`Added ${records.length} sample expenses across the last six months.`);
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
