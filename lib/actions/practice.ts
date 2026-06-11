"use server";

import { and, asc, eq, inArray, lte } from "drizzle-orm";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { db, schema } from "@/lib/db/client";
import {
  applyRating,
  freshCardState,
  previewIntervals,
  ratingFromInt,
  type Rating1to4,
} from "@/lib/srs";
import type { Answer, RefType, Story } from "@/lib/db/schema";

export async function addToDeck(refType: RefType, refId: string): Promise<void> {
  const userId = await requireAuth();
  const existing = await db
    .select({ id: schema.fsrsCards.id })
    .from(schema.fsrsCards)
    .where(
      and(
        eq(schema.fsrsCards.userId, userId),
        eq(schema.fsrsCards.refType, refType),
        eq(schema.fsrsCards.refId, refId),
      ),
    )
    .limit(1);
  if (existing.length > 0) return;

  const state = freshCardState();
  await db.insert(schema.fsrsCards).values({
    id: nanoid(),
    userId,
    refType,
    refId,
    fsrsDue: new Date(state.due).getTime(),
    fsrsState: state,
    createdAt: Date.now(),
  });
  revalidatePath("/", "layout");
}

export async function removeFromDeck(
  refType: RefType,
  refId: string,
): Promise<void> {
  const userId = await requireAuth();
  await db
    .delete(schema.fsrsCards)
    .where(
      and(
        eq(schema.fsrsCards.userId, userId),
        eq(schema.fsrsCards.refType, refType),
        eq(schema.fsrsCards.refId, refId),
      ),
    );
  revalidatePath("/", "layout");
}

export async function isInDeck(refType: RefType, refId: string): Promise<boolean> {
  const userId = await requireAuth();
  const rows = await db
    .select({ id: schema.fsrsCards.id })
    .from(schema.fsrsCards)
    .where(
      and(
        eq(schema.fsrsCards.userId, userId),
        eq(schema.fsrsCards.refType, refType),
        eq(schema.fsrsCards.refId, refId),
      ),
    )
    .limit(1);
  return rows.length > 0;
}

export type DeckStats = {
  story: { total: number; due: number };
  question: { total: number; due: number };
};

export async function getDeckStats(): Promise<DeckStats> {
  const userId = await requireAuth();
  const now = Date.now();
  const cards = await db
    .select({
      refType: schema.fsrsCards.refType,
      fsrsDue: schema.fsrsCards.fsrsDue,
    })
    .from(schema.fsrsCards)
    .where(eq(schema.fsrsCards.userId, userId));
  const stats: DeckStats = {
    story: { total: 0, due: 0 },
    question: { total: 0, due: 0 },
  };
  for (const c of cards) {
    const bucket = stats[c.refType];
    bucket.total += 1;
    if (c.fsrsDue <= now) bucket.due += 1;
  }
  return stats;
}

export type ReviewCard = {
  cardId: string;
  refType: RefType;
  refId: string;
  intervals: Record<Rating1to4, string>;
  front: { kicker: string; title: string; prompt: string };
  back: { sections: { label: string; body: string }[]; chips: string[] };
};

export async function getSessionCards(
  deck: "story" | "question" | "all",
  limit = 20,
): Promise<ReviewCard[]> {
  const userId = await requireAuth();
  const now = Date.now();

  const conditions = [
    eq(schema.fsrsCards.userId, userId),
    lte(schema.fsrsCards.fsrsDue, now),
  ];
  if (deck !== "all") conditions.push(eq(schema.fsrsCards.refType, deck));

  const cards = await db
    .select()
    .from(schema.fsrsCards)
    .where(and(...conditions))
    .orderBy(asc(schema.fsrsCards.fsrsDue))
    .limit(limit);
  if (cards.length === 0) return [];

  const storyIds = cards.filter((c) => c.refType === "story").map((c) => c.refId);
  const questionIds = cards
    .filter((c) => c.refType === "question")
    .map((c) => c.refId);

  const [storyRows, questionRows, categories, linkRows, answerRows, allStories] =
    await Promise.all([
      storyIds.length
        ? db
            .select()
            .from(schema.stories)
            .where(
              and(
                eq(schema.stories.userId, userId),
                inArray(schema.stories.id, storyIds),
              ),
            )
        : Promise.resolve([]),
      questionIds.length
        ? db
            .select()
            .from(schema.questions)
            .where(inArray(schema.questions.id, questionIds))
        : Promise.resolve([]),
      db.select().from(schema.categories),
      questionIds.length
        ? db
            .select()
            .from(schema.storyQuestionLinks)
            .where(
              and(
                eq(schema.storyQuestionLinks.userId, userId),
                inArray(schema.storyQuestionLinks.questionId, questionIds),
              ),
            )
        : Promise.resolve([]),
      questionIds.length
        ? db
            .select()
            .from(schema.answers)
            .where(
              and(
                eq(schema.answers.userId, userId),
                inArray(schema.answers.questionId, questionIds),
              ),
            )
        : Promise.resolve([]),
      db.select().from(schema.stories).where(eq(schema.stories.userId, userId)),
    ]);

  const storyById = new Map(allStories.map((s: Story) => [s.id, s]));
  const catById = new Map(categories.map((c) => [c.id, c.name]));

  const result: ReviewCard[] = [];
  for (const card of cards) {
    const intervals = previewIntervals(card.fsrsState);
    if (card.refType === "story") {
      const s = storyRows.find((r) => r.id === card.refId);
      if (!s) continue;
      const sections: { label: string; body: string }[] = [];
      if (s.oneLiner) sections.push({ label: "Hook", body: s.oneLiner });
      if (s.situation) sections.push({ label: "Situation", body: s.situation });
      if (s.task) sections.push({ label: "Task", body: s.task });
      if (s.action) sections.push({ label: "Action", body: s.action });
      if (s.result) sections.push({ label: "Result", body: s.result });
      if (s.metrics) sections.push({ label: "Key numbers", body: s.metrics });
      result.push({
        cardId: card.id,
        refType: "story",
        refId: card.refId,
        intervals,
        front: {
          kicker: s.context || "Story",
          title: s.title,
          prompt:
            "Recite the full story out loud — hook, situation, task, action, result, numbers.",
        },
        back: { sections, chips: s.themes },
      });
    } else {
      const q = questionRows.find((r) => r.id === card.refId);
      if (!q) continue;
      const sections: { label: string; body: string }[] = [];
      const answer = answerRows.find((a: Answer) => a.questionId === q.id);
      if (answer) sections.push({ label: "Your written answer", body: answer.body });
      const qLinks = linkRows.filter((l) => l.questionId === q.id);
      for (const l of qLinks) {
        const s = storyById.get(l.storyId);
        if (!s) continue;
        sections.push({
          label: `Story — ${s.title}${l.isPrimary ? " (go-to)" : ""}`,
          body: l.angle || s.oneLiner || "No angle note yet.",
        });
      }
      if (sections.length === 0)
        sections.push({
          label: "No prep yet",
          body: "You haven't linked a story or written an answer for this one — do that after the session.",
        });
      result.push({
        cardId: card.id,
        refType: "question",
        refId: card.refId,
        intervals,
        front: {
          kicker: catById.get(q.categoryId) ?? "Question",
          title: q.text,
          prompt: "Answer out loud — which story, what angle, what's the headline?",
        },
        back: {
          sections,
          chips: qLinks
            .map((l) => storyById.get(l.storyId)?.title ?? "")
            .filter(Boolean),
        },
      });
    }
  }
  return result;
}

export async function rateCard(
  cardId: string,
  rating: number,
): Promise<{ ok: boolean }> {
  const userId = await requireAuth();
  const r = ratingFromInt(rating);
  if (!r) return { ok: false };

  const rows = await db
    .select()
    .from(schema.fsrsCards)
    .where(
      and(eq(schema.fsrsCards.id, cardId), eq(schema.fsrsCards.userId, userId)),
    )
    .limit(1);
  if (rows.length === 0) return { ok: false };
  const card = rows[0];

  const next = applyRating(card.fsrsState, r);
  await db
    .update(schema.fsrsCards)
    .set({
      fsrsState: next.state,
      fsrsDue: next.dueMs,
      reps: card.reps + 1,
      lapses: next.lapses,
      lastReviewedAt: Date.now(),
    })
    .where(eq(schema.fsrsCards.id, cardId));

  await db.insert(schema.practiceLog).values({
    id: nanoid(),
    userId,
    refType: card.refType,
    refId: card.refId,
    rating: r,
    createdAt: Date.now(),
  });
  return { ok: true };
}
