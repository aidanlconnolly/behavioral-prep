/**
 * Loads seed content (categories + question bank) into the DB.
 *
 *   set -a && source .env.local && set +a
 *   PATH=/opt/homebrew/bin:$PATH npm run seed
 *
 * Idempotent and user-safe: only rows with userId IS NULL are replaced, and
 * ids are stable, so user links/answers pointing at seeded questions survive.
 */
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { isNull } from "drizzle-orm";
import * as schema from "../lib/db/schema";
import { SEED_CATEGORIES } from "../seed/categories";
import { SEED_QUESTIONS } from "../seed/questions";

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  if (!url) {
    throw new Error(
      "TURSO_DATABASE_URL is not set. Run: set -a && source .env.local && set +a",
    );
  }
  const client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
  const db = drizzle(client, { schema });

  // Categories are fully owned by the seed (users can't create them).
  await db.delete(schema.categories);
  await db.insert(schema.categories).values(SEED_CATEGORIES);
  console.log(`✓ ${SEED_CATEGORIES.length} categories`);

  // Questions: replace only the seeded (global) rows.
  await db.delete(schema.questions).where(isNull(schema.questions.userId));
  const now = Date.now();
  await db.insert(schema.questions).values(
    SEED_QUESTIONS.map((q) => ({
      id: q.id,
      userId: null,
      categoryId: q.categoryId,
      targetId: null,
      text: q.text,
      importance: q.importance,
      notes: q.notes,
      createdAt: now,
    })),
  );
  console.log(`✓ ${SEED_QUESTIONS.length} seeded questions`);

  client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
