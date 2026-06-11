"use server";

import { and, eq, isNull } from "drizzle-orm";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { db, schema } from "@/lib/db/client";
import { applyOverride, overridesFor } from "@/lib/question-overrides";
import type { Answer, Question, Target, TargetKind } from "@/lib/db/schema";

export type TargetWithCounts = Target & {
  questionCount: number;
  answerCount: number;
};

export async function listTargets(): Promise<TargetWithCounts[]> {
  const userId = await requireAuth();
  const [targets, questions, answers] = await Promise.all([
    db.select().from(schema.targets).where(eq(schema.targets.userId, userId)),
    db
      .select({ targetId: schema.questions.targetId })
      .from(schema.questions)
      .where(eq(schema.questions.userId, userId)),
    db
      .select({ targetId: schema.answers.targetId })
      .from(schema.answers)
      .where(eq(schema.answers.userId, userId)),
  ]);

  const qCount = new Map<string, number>();
  for (const q of questions)
    if (q.targetId) qCount.set(q.targetId, (qCount.get(q.targetId) ?? 0) + 1);
  const aCount = new Map<string, number>();
  for (const a of answers)
    if (a.targetId) aCount.set(a.targetId, (aCount.get(a.targetId) ?? 0) + 1);

  return targets
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((t) => ({
      ...t,
      questionCount: qCount.get(t.id) ?? 0,
      answerCount: aCount.get(t.id) ?? 0,
    }));
}

export type TargetDetail = {
  target: Target;
  /** This target's own question variants (user-created, scoped). */
  variantQuestions: (Question & { hasAnswer: boolean })[];
  /** Generic template questions for this kind (why_company / why_industry). */
  templateQuestions: (Question & { answer: Answer | null })[];
  /** Free-form pitch (answers row with kind=pitch, no question). */
  pitch: Answer | null;
};

export async function getTarget(id: string): Promise<TargetDetail | null> {
  const userId = await requireAuth();
  const rows = await db
    .select()
    .from(schema.targets)
    .where(and(eq(schema.targets.id, id), eq(schema.targets.userId, userId)))
    .limit(1);
  if (rows.length === 0) return null;
  const target = rows[0];

  const templateSlug =
    target.kind === "company" ? "why_company" : "why_industry";

  const [variantQuestions, targetAnswers, templateCats] = await Promise.all([
    db
      .select()
      .from(schema.questions)
      .where(
        and(
          eq(schema.questions.userId, userId),
          eq(schema.questions.targetId, id),
        ),
      ),
    db
      .select()
      .from(schema.answers)
      .where(
        and(eq(schema.answers.userId, userId), eq(schema.answers.targetId, id)),
      ),
    db
      .select()
      .from(schema.categories)
      .where(eq(schema.categories.slug, templateSlug))
      .limit(1),
  ]);

  let templateQuestions: (Question & { answer: Answer | null })[] = [];
  if (templateCats.length > 0) {
    const templates = await db
      .select()
      .from(schema.questions)
      .where(
        and(
          eq(schema.questions.categoryId, templateCats[0].id),
          isNull(schema.questions.userId),
        ),
      );
    const overrides = await overridesFor(userId);
    templateQuestions = templates
      .map((q) => applyOverride(q, overrides.get(q.id)))
      .sort((a, b) => b.importance - a.importance)
      .map((q) => ({
        ...q,
        answer:
          targetAnswers.find(
            (a: Answer) => a.questionId === q.id && a.kind === "answer",
          ) ?? null,
      }));
  }

  const answeredVariantIds = new Set(
    targetAnswers.filter((a: Answer) => a.questionId).map((a) => a.questionId),
  );

  return {
    target,
    variantQuestions: variantQuestions
      .sort((a, b) => b.importance - a.importance)
      .map((q) => ({ ...q, hasAnswer: answeredVariantIds.has(q.id) })),
    templateQuestions,
    pitch:
      targetAnswers.find((a: Answer) => !a.questionId && a.kind === "pitch") ??
      null,
  };
}

export async function createTarget(input: {
  kind: TargetKind;
  name: string;
  role?: string;
}): Promise<string> {
  const userId = await requireAuth();
  const name = input.name.trim();
  if (!name) throw new Error("Name is required");
  const id = nanoid();
  const now = Date.now();
  await db.insert(schema.targets).values({
    id,
    userId,
    kind: input.kind,
    name,
    role: input.role?.trim() ?? "",
    createdAt: now,
    updatedAt: now,
  });
  revalidatePath("/", "layout");
  return id;
}

export async function updateTarget(
  id: string,
  patch: Partial<{
    name: string;
    role: string;
    notes: string;
    whyThem: string;
    status: "active" | "archived";
  }>,
): Promise<void> {
  const userId = await requireAuth();
  await db
    .update(schema.targets)
    .set({ ...patch, updatedAt: Date.now() })
    .where(and(eq(schema.targets.id, id), eq(schema.targets.userId, userId)));
  revalidatePath("/", "layout");
}

export async function deleteTarget(id: string): Promise<void> {
  const userId = await requireAuth();

  // Cascade: this target's variant questions (and their links/answers/cards),
  // then any target-scoped answers, then the target itself.
  const variants = await db
    .select({ id: schema.questions.id })
    .from(schema.questions)
    .where(
      and(eq(schema.questions.userId, userId), eq(schema.questions.targetId, id)),
    );
  for (const v of variants) {
    await db
      .delete(schema.storyQuestionLinks)
      .where(
        and(
          eq(schema.storyQuestionLinks.userId, userId),
          eq(schema.storyQuestionLinks.questionId, v.id),
        ),
      );
    await db
      .delete(schema.fsrsCards)
      .where(
        and(
          eq(schema.fsrsCards.userId, userId),
          eq(schema.fsrsCards.refType, "question"),
          eq(schema.fsrsCards.refId, v.id),
        ),
      );
    await db
      .delete(schema.questions)
      .where(and(eq(schema.questions.id, v.id), eq(schema.questions.userId, userId)));
  }
  await db
    .delete(schema.answers)
    .where(
      and(eq(schema.answers.userId, userId), eq(schema.answers.targetId, id)),
    );
  await db
    .delete(schema.targets)
    .where(and(eq(schema.targets.id, id), eq(schema.targets.userId, userId)));
  revalidatePath("/", "layout");
  redirect("/targets");
}
