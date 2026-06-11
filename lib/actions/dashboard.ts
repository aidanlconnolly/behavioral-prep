"use server";

import { eq, isNull, or } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { db, schema } from "@/lib/db/client";
import type { StoryStatus } from "@/lib/db/schema";

export type CoverageRow = {
  categoryId: string;
  slug: string;
  name: string;
  kind: string;
  expectsStory: boolean;
  questionCount: number;
  /** Questions in this category with at least one linked story. */
  linkedQuestionCount: number;
  /** Stories tagged with this category slug. */
  taggedStoryCount: number;
  /** Questions in this category with a written answer. */
  answeredQuestionCount: number;
};

export type Dashboard = {
  coverage: CoverageRow[];
  due: { story: number; question: number };
  deckTotals: { story: number; question: number };
  storyStatus: Record<StoryStatus, number>;
  storyTotal: number;
  streakDays: number;
  repsLast7: number;
  targetCounts: { company: number; industry: number };
};

export async function getDashboard(): Promise<Dashboard> {
  const userId = await requireAuth();
  const now = Date.now();

  const [categories, questions, links, stories, answers, cards, log, targets] =
    await Promise.all([
      db.select().from(schema.categories),
      db
        .select()
        .from(schema.questions)
        .where(
          or(isNull(schema.questions.userId), eq(schema.questions.userId, userId)),
        ),
      db
        .select()
        .from(schema.storyQuestionLinks)
        .where(eq(schema.storyQuestionLinks.userId, userId)),
      db.select().from(schema.stories).where(eq(schema.stories.userId, userId)),
      db.select().from(schema.answers).where(eq(schema.answers.userId, userId)),
      db
        .select({
          refType: schema.fsrsCards.refType,
          fsrsDue: schema.fsrsCards.fsrsDue,
        })
        .from(schema.fsrsCards)
        .where(eq(schema.fsrsCards.userId, userId)),
      db
        .select({ createdAt: schema.practiceLog.createdAt })
        .from(schema.practiceLog)
        .where(eq(schema.practiceLog.userId, userId)),
      db.select().from(schema.targets).where(eq(schema.targets.userId, userId)),
    ]);

  const linkedQuestionIds = new Set(links.map((l) => l.questionId));
  const answeredQuestionIds = new Set(
    answers.filter((a) => a.questionId).map((a) => a.questionId as string),
  );

  const coverage: CoverageRow[] = categories
    .sort((a, b) => a.order - b.order)
    .map((c) => {
      const qs = questions.filter((q) => q.categoryId === c.id);
      return {
        categoryId: c.id,
        slug: c.slug,
        name: c.name,
        kind: c.kind,
        expectsStory: c.expectsStory,
        questionCount: qs.length,
        linkedQuestionCount: qs.filter((q) => linkedQuestionIds.has(q.id)).length,
        taggedStoryCount: stories.filter((s) => s.themes.includes(c.slug)).length,
        answeredQuestionCount: qs.filter((q) => answeredQuestionIds.has(q.id))
          .length,
      };
    });

  const due = { story: 0, question: 0 };
  const deckTotals = { story: 0, question: 0 };
  for (const c of cards) {
    deckTotals[c.refType] += 1;
    if (c.fsrsDue <= now) due[c.refType] += 1;
  }

  const storyStatus: Record<StoryStatus, number> = {
    draft: 0,
    polished: 0,
    memorized: 0,
  };
  for (const s of stories) storyStatus[s.status] += 1;

  // Streak: consecutive days (local) ending today/yesterday with ≥1 rep.
  const days = new Set(
    log.map((l) => new Date(l.createdAt).toISOString().slice(0, 10)),
  );
  let streakDays = 0;
  const cursor = new Date();
  if (!days.has(cursor.toISOString().slice(0, 10))) {
    cursor.setDate(cursor.getDate() - 1); // streak survives until end of today
  }
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streakDays += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  const weekAgo = now - 7 * 86_400_000;
  const repsLast7 = log.filter((l) => l.createdAt >= weekAgo).length;

  return {
    coverage,
    due,
    deckTotals,
    storyStatus,
    storyTotal: stories.length,
    streakDays,
    repsLast7,
    targetCounts: {
      company: targets.filter((t) => t.kind === "company").length,
      industry: targets.filter((t) => t.kind === "industry").length,
    },
  };
}
