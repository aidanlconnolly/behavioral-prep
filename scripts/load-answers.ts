/**
 * Bulk-load written answers into a user's account from an external JSON file.
 *
 *   set -a && source .env.local && set +a
 *   USER_EMAIL=you@example.com \
 *   ANSWERS_FILE="/absolute/path/to/behavioral-answers.json" \
 *   PATH=/opt/homebrew/bin:$PATH npx tsx scripts/load-answers.ts
 *
 * Idempotent: upserts by (userId, questionId, targetId, kind), matching the
 * app's saveAnswer logic. Re-running edits in place. Answer content lives
 * OUTSIDE this repo (it's personal); only this plumbing is committed.
 */
import { readFileSync } from "node:fs";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { and, eq, isNull } from "drizzle-orm";
import { nanoid } from "nanoid";
import * as schema from "../lib/db/schema";

type AnswerSeed = {
  questionId?: string;
  targetId?: string;
  kind?: "answer" | "pitch" | "talking_points";
  body: string;
};

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  if (!url) throw new Error("TURSO_DATABASE_URL is not set (source .env.local).");
  const email = (process.env.USER_EMAIL ?? "").trim().toLowerCase();
  if (!email) throw new Error("USER_EMAIL is not set.");
  const file = process.env.ANSWERS_FILE;
  if (!file) throw new Error("ANSWERS_FILE is not set (path to the answers JSON).");

  const db = drizzle(
    createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN }),
    { schema },
  );

  const userRows = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .limit(1);
  if (userRows.length === 0) {
    throw new Error(`No user with email "${email}". Register in the app first.`);
  }
  const userId = userRows[0].id;

  const knownQuestionIds = new Set(
    (await db.select({ id: schema.questions.id }).from(schema.questions)).map(
      (q) => q.id,
    ),
  );

  const parsed = JSON.parse(readFileSync(file, "utf8")) as { answers: AnswerSeed[] };
  let inserted = 0;
  let updated = 0;

  for (const a of parsed.answers) {
    const questionId = a.questionId ?? null;
    const targetId = a.targetId ?? null;
    const kind = a.kind ?? "answer";
    if (!questionId && !targetId) {
      console.warn("  ! skipping answer with neither questionId nor targetId");
      continue;
    }
    if (questionId && !knownQuestionIds.has(questionId)) {
      console.warn(`  ! skipping unknown question id ${questionId}`);
      continue;
    }

    const now = Date.now();
    const existing = await db
      .select({ id: schema.answers.id })
      .from(schema.answers)
      .where(
        and(
          eq(schema.answers.userId, userId),
          questionId
            ? eq(schema.answers.questionId, questionId)
            : isNull(schema.answers.questionId),
          targetId
            ? eq(schema.answers.targetId, targetId)
            : isNull(schema.answers.targetId),
          eq(schema.answers.kind, kind),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(schema.answers)
        .set({ body: a.body, updatedAt: now })
        .where(eq(schema.answers.id, existing[0].id));
      updated++;
    } else {
      await db.insert(schema.answers).values({
        id: nanoid(),
        userId,
        questionId,
        targetId,
        kind,
        body: a.body,
        createdAt: now,
        updatedAt: now,
      });
      inserted++;
    }
    console.log(`✓ ${questionId ?? targetId}`);
  }

  console.log(`\nDone — ${inserted} inserted, ${updated} updated, for ${email}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
