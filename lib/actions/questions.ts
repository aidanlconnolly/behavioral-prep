"use server";

import { and, eq, isNull, or } from "drizzle-orm";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { db, schema } from "@/lib/db/client";
import { applyOverride, overridesFor } from "@/lib/question-overrides";
import type {
  Answer,
  Category,
  Question,
  Story,
  StoryQuestionLink,
  Target,
} from "@/lib/db/schema";

export type LinkedStoryChip = {
  linkId: string;
  storyId: string;
  title: string;
  status: string;
  isPrimary: boolean;
  angle: string;
};

export type QuestionWithMeta = Question & {
  categorySlug: string;
  categoryName: string;
  linkedStories: LinkedStoryChip[];
  hasAnswer: boolean;
  isMine: boolean;
  targetName: string | null;
};

/** Questions visible to the current user: seeded (userId NULL) + their own. */
async function visibleQuestions(userId: string): Promise<Question[]> {
  return db
    .select()
    .from(schema.questions)
    .where(
      or(isNull(schema.questions.userId), eq(schema.questions.userId, userId)),
    );
}

export async function listCategories(): Promise<Category[]> {
  const rows = await db.select().from(schema.categories);
  return rows.sort((a, b) => a.order - b.order);
}

export async function listQuestionsWithMeta(): Promise<{
  categories: Category[];
  questions: QuestionWithMeta[];
}> {
  const userId = await requireAuth();
  const [categories, rawQuestions, links, stories, answers, targets, overrides] =
    await Promise.all([
      listCategories(),
      visibleQuestions(userId),
      db
        .select()
        .from(schema.storyQuestionLinks)
        .where(eq(schema.storyQuestionLinks.userId, userId)),
      db
        .select()
        .from(schema.stories)
        .where(eq(schema.stories.userId, userId)),
      db
        .select()
        .from(schema.answers)
        .where(eq(schema.answers.userId, userId)),
      db
        .select()
        .from(schema.targets)
        .where(eq(schema.targets.userId, userId)),
      overridesFor(userId),
    ]);
  const questions = rawQuestions.map((q) => applyOverride(q, overrides.get(q.id)));

  const catById = new Map(categories.map((c) => [c.id, c]));
  const storyById = new Map(stories.map((s: Story) => [s.id, s]));
  const targetById = new Map(targets.map((t: Target) => [t.id, t]));
  const linksByQuestion = new Map<string, StoryQuestionLink[]>();
  for (const l of links) {
    const arr = linksByQuestion.get(l.questionId) ?? [];
    arr.push(l);
    linksByQuestion.set(l.questionId, arr);
  }
  const answeredQuestionIds = new Set(
    answers.filter((a: Answer) => a.questionId).map((a: Answer) => a.questionId),
  );

  const withMeta: QuestionWithMeta[] = questions.map((q) => {
    const cat = catById.get(q.categoryId);
    const qLinks = linksByQuestion.get(q.id) ?? [];
    const linkedStories: LinkedStoryChip[] = [];
    for (const l of qLinks) {
      const s = storyById.get(l.storyId);
      if (!s) continue;
      linkedStories.push({
        linkId: l.id,
        storyId: s.id,
        title: s.title,
        status: s.status,
        isPrimary: l.isPrimary,
        angle: l.angle,
      });
    }
    return {
      ...q,
      categorySlug: cat?.slug ?? "",
      categoryName: cat?.name ?? "",
      linkedStories,
      hasAnswer: answeredQuestionIds.has(q.id),
      isMine: q.userId === userId,
      targetName: q.targetId ? (targetById.get(q.targetId)?.name ?? null) : null,
    };
  });

  // Sort: category order, then importance desc, then text.
  const orderByCat = new Map(categories.map((c) => [c.id, c.order]));
  withMeta.sort((a, b) => {
    const co =
      (orderByCat.get(a.categoryId) ?? 0) - (orderByCat.get(b.categoryId) ?? 0);
    if (co !== 0) return co;
    if (a.importance !== b.importance) return b.importance - a.importance;
    return a.text.localeCompare(b.text);
  });

  return { categories, questions: withMeta };
}

export type QuestionDetail = {
  question: Question;
  category: Category | null;
  target: Target | null;
  answer: Answer | null;
  links: (StoryQuestionLink & { story: Story })[];
  isMine: boolean;
  /** Seeded question that this user has edited (has an override row). */
  isEdited: boolean;
};

export async function getQuestion(id: string): Promise<QuestionDetail | null> {
  const userId = await requireAuth();
  const rows = await db
    .select()
    .from(schema.questions)
    .where(
      and(
        eq(schema.questions.id, id),
        or(isNull(schema.questions.userId), eq(schema.questions.userId, userId)),
      ),
    )
    .limit(1);
  if (rows.length === 0) return null;
  const overrides = await overridesFor(userId);
  const override = overrides.get(rows[0].id);
  const question = applyOverride(rows[0], override);

  const [categories, linkRows, answerRows, targetRows] = await Promise.all([
    db
      .select()
      .from(schema.categories)
      .where(eq(schema.categories.id, question.categoryId))
      .limit(1),
    db
      .select({ link: schema.storyQuestionLinks, story: schema.stories })
      .from(schema.storyQuestionLinks)
      .innerJoin(
        schema.stories,
        eq(schema.storyQuestionLinks.storyId, schema.stories.id),
      )
      .where(
        and(
          eq(schema.storyQuestionLinks.userId, userId),
          eq(schema.storyQuestionLinks.questionId, id),
        ),
      ),
    db
      .select()
      .from(schema.answers)
      .where(
        and(
          eq(schema.answers.userId, userId),
          eq(schema.answers.questionId, id),
          question.targetId
            ? eq(schema.answers.targetId, question.targetId)
            : isNull(schema.answers.targetId),
        ),
      )
      .limit(1),
    question.targetId
      ? db
          .select()
          .from(schema.targets)
          .where(
            and(
              eq(schema.targets.id, question.targetId),
              eq(schema.targets.userId, userId),
            ),
          )
          .limit(1)
      : Promise.resolve([] as Target[]),
  ]);

  return {
    question,
    category: categories[0] ?? null,
    target: targetRows[0] ?? null,
    answer: answerRows[0] ?? null,
    links: linkRows.map((r) => ({ ...r.link, story: r.story })),
    isMine: question.userId === userId,
    isEdited: question.userId === null && override !== undefined,
  };
}

export async function createQuestion(input: {
  categoryId: string;
  text: string;
  importance?: number;
  notes?: string;
  targetId?: string;
}): Promise<string> {
  const userId = await requireAuth();
  const text = input.text.trim();
  if (!text) throw new Error("Question text is required");
  const id = nanoid();
  await db.insert(schema.questions).values({
    id,
    userId,
    categoryId: input.categoryId,
    targetId: input.targetId ?? null,
    text,
    importance: input.importance ?? 2,
    notes: input.notes?.trim() ?? "",
    createdAt: Date.now(),
  });
  revalidatePath("/", "layout");
  return id;
}

export async function updateQuestion(
  id: string,
  patch: Partial<{
    text: string;
    importance: number;
    notes: string;
    categoryId: string;
  }>,
): Promise<void> {
  const userId = await requireAuth();
  const rows = await db
    .select()
    .from(schema.questions)
    .where(eq(schema.questions.id, id))
    .limit(1);
  if (rows.length === 0) return;
  const q = rows[0];
  const now = Date.now();

  if (q.userId === userId) {
    // User-owned question: edit the row directly.
    await db
      .update(schema.questions)
      .set(patch)
      .where(and(eq(schema.questions.id, id), eq(schema.questions.userId, userId)));
  } else if (q.userId === null) {
    // Seeded (shared) question: store the edit as a per-user override so the
    // global row is untouched and existing links/answers stay valid.
    const existing = await db
      .select({ id: schema.questionOverrides.id })
      .from(schema.questionOverrides)
      .where(
        and(
          eq(schema.questionOverrides.userId, userId),
          eq(schema.questionOverrides.questionId, id),
        ),
      )
      .limit(1);
    const fields = {
      text: patch.text ?? null,
      notes: patch.notes ?? null,
      importance: patch.importance ?? null,
    };
    if (existing.length > 0) {
      await db
        .update(schema.questionOverrides)
        .set({ ...fields, updatedAt: now })
        .where(eq(schema.questionOverrides.id, existing[0].id));
    } else {
      await db.insert(schema.questionOverrides).values({
        id: nanoid(),
        userId,
        questionId: id,
        ...fields,
        createdAt: now,
        updatedAt: now,
      });
    }
  }
  revalidatePath("/", "layout");
}

/** Revert a seeded question to its original text by dropping the user's edit. */
export async function resetQuestion(id: string): Promise<void> {
  const userId = await requireAuth();
  await db
    .delete(schema.questionOverrides)
    .where(
      and(
        eq(schema.questionOverrides.userId, userId),
        eq(schema.questionOverrides.questionId, id),
      ),
    );
  revalidatePath("/", "layout");
}

export async function deleteQuestion(id: string): Promise<void> {
  const userId = await requireAuth();
  const rows = await db
    .select({ id: schema.questions.id })
    .from(schema.questions)
    .where(and(eq(schema.questions.id, id), eq(schema.questions.userId, userId)))
    .limit(1);
  if (rows.length === 0) return; // seeded or not yours — refuse silently

  await db
    .delete(schema.storyQuestionLinks)
    .where(
      and(
        eq(schema.storyQuestionLinks.userId, userId),
        eq(schema.storyQuestionLinks.questionId, id),
      ),
    );
  await db
    .delete(schema.answers)
    .where(
      and(eq(schema.answers.userId, userId), eq(schema.answers.questionId, id)),
    );
  await db
    .delete(schema.fsrsCards)
    .where(
      and(
        eq(schema.fsrsCards.userId, userId),
        eq(schema.fsrsCards.refType, "question"),
        eq(schema.fsrsCards.refId, id),
      ),
    );
  await db
    .delete(schema.practiceLog)
    .where(
      and(
        eq(schema.practiceLog.userId, userId),
        eq(schema.practiceLog.refType, "question"),
        eq(schema.practiceLog.refId, id),
      ),
    );
  await db
    .delete(schema.questions)
    .where(and(eq(schema.questions.id, id), eq(schema.questions.userId, userId)));
  revalidatePath("/", "layout");
  redirect("/questions");
}
