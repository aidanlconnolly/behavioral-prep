/**
 * Bulk-load STAR stories into a user's account from an external JSON file.
 *
 *   set -a && source .env.local && set +a
 *   USER_EMAIL=you@example.com \
 *   STORIES_FILE="/absolute/path/to/behavioral-stories.json" \
 *   PATH=/opt/homebrew/bin:$PATH npx tsx scripts/load-stories.ts
 *
 * Idempotent: matches existing stories by (userId, title) and updates them in
 * place, so re-running edits rather than duplicating. Auto-creates story↔question
 * links (deduped) and marks one primary "go-to" story per question.
 *
 * The story content lives OUTSIDE this repo (it's personal); only this plumbing
 * is committed. Point STORIES_FILE at your private file.
 */
import { readFileSync } from "node:fs";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import * as schema from "../lib/db/schema";

type StorySeed = {
  title: string;
  oneLiner?: string;
  situation?: string;
  task?: string;
  action?: string;
  result?: string;
  metrics?: string;
  context?: string;
  themes?: string[];
  status?: "draft" | "polished" | "memorized";
  linkQuestionIds?: string[];
  primaryQuestionId?: string;
  needsConfirmation?: boolean;
};

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  if (!url) throw new Error("TURSO_DATABASE_URL is not set (source .env.local).");
  const email = (process.env.USER_EMAIL ?? "").trim().toLowerCase();
  if (!email) throw new Error("USER_EMAIL is not set.");
  const file = process.env.STORIES_FILE;
  if (!file) throw new Error("STORIES_FILE is not set (path to the stories JSON).");

  const includeDrafts = process.env.INCLUDE_DRAFTS !== "false"; // default: load drafts too

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
    throw new Error(
      `No user with email "${email}". Register in the app first, then re-run.`,
    );
  }
  const userId = userRows[0].id;

  const parsed = JSON.parse(readFileSync(file, "utf8")) as { stories: StorySeed[] };
  const seeds = parsed.stories.filter((s) => includeDrafts || !s.needsConfirmation);

  // Validate question ids against what's actually in the bank for this user.
  const questionRows = await db
    .select({ id: schema.questions.id })
    .from(schema.questions);
  const knownQuestionIds = new Set(questionRows.map((q) => q.id));

  let inserted = 0;
  let updated = 0;

  for (const s of seeds) {
    const now = Date.now();
    const existing = await db
      .select({ id: schema.stories.id })
      .from(schema.stories)
      .where(and(eq(schema.stories.userId, userId), eq(schema.stories.title, s.title)))
      .limit(1);

    let storyId: string;
    const values = {
      oneLiner: s.oneLiner ?? "",
      situation: s.situation ?? "",
      task: s.task ?? "",
      action: s.action ?? "",
      result: s.result ?? "",
      metrics: s.metrics ?? "",
      context: s.context ?? "",
      themes: s.themes ?? [],
      status: s.status ?? "draft",
      updatedAt: now,
    };

    if (existing.length > 0) {
      storyId = existing[0].id;
      await db.update(schema.stories).set(values).where(eq(schema.stories.id, storyId));
      updated++;
    } else {
      storyId = nanoid();
      await db.insert(schema.stories).values({
        id: storyId,
        userId,
        title: s.title,
        createdAt: now,
        ...values,
      });
      inserted++;
    }

    for (const qid of s.linkQuestionIds ?? []) {
      if (!knownQuestionIds.has(qid)) {
        console.warn(`  ! skipping unknown question id ${qid} for "${s.title}"`);
        continue;
      }
      const isPrimary = qid === s.primaryQuestionId;
      const link = await db
        .select({ id: schema.storyQuestionLinks.id })
        .from(schema.storyQuestionLinks)
        .where(
          and(
            eq(schema.storyQuestionLinks.userId, userId),
            eq(schema.storyQuestionLinks.storyId, storyId),
            eq(schema.storyQuestionLinks.questionId, qid),
          ),
        )
        .limit(1);
      if (link.length > 0) {
        await db
          .update(schema.storyQuestionLinks)
          .set({ isPrimary })
          .where(eq(schema.storyQuestionLinks.id, link[0].id));
      } else {
        await db.insert(schema.storyQuestionLinks).values({
          id: nanoid(),
          userId,
          storyId,
          questionId: qid,
          angle: "",
          isPrimary,
          createdAt: now,
        });
      }
    }
    console.log(`✓ ${s.title}`);
  }

  console.log(`\nDone — ${inserted} inserted, ${updated} updated, for ${email}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
