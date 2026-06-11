"use server";

import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { db, schema } from "@/lib/db/client";

export async function linkStoryToQuestion(
  storyId: string,
  questionId: string,
  angle = "",
): Promise<void> {
  const userId = await requireAuth();
  const existing = await db
    .select({ id: schema.storyQuestionLinks.id })
    .from(schema.storyQuestionLinks)
    .where(
      and(
        eq(schema.storyQuestionLinks.userId, userId),
        eq(schema.storyQuestionLinks.storyId, storyId),
        eq(schema.storyQuestionLinks.questionId, questionId),
      ),
    )
    .limit(1);
  if (existing.length > 0) return;

  await db.insert(schema.storyQuestionLinks).values({
    id: nanoid(),
    userId,
    storyId,
    questionId,
    angle,
    createdAt: Date.now(),
  });
  revalidatePath("/", "layout");
}

export async function updateLink(
  linkId: string,
  patch: Partial<{ angle: string; isPrimary: boolean }>,
): Promise<void> {
  const userId = await requireAuth();

  if (patch.isPrimary) {
    // Only one primary story per question: demote siblings first.
    const rows = await db
      .select()
      .from(schema.storyQuestionLinks)
      .where(
        and(
          eq(schema.storyQuestionLinks.id, linkId),
          eq(schema.storyQuestionLinks.userId, userId),
        ),
      )
      .limit(1);
    if (rows.length > 0) {
      await db
        .update(schema.storyQuestionLinks)
        .set({ isPrimary: false })
        .where(
          and(
            eq(schema.storyQuestionLinks.userId, userId),
            eq(schema.storyQuestionLinks.questionId, rows[0].questionId),
          ),
        );
    }
  }

  await db
    .update(schema.storyQuestionLinks)
    .set(patch)
    .where(
      and(
        eq(schema.storyQuestionLinks.id, linkId),
        eq(schema.storyQuestionLinks.userId, userId),
      ),
    );
  revalidatePath("/", "layout");
}

export async function unlink(linkId: string): Promise<void> {
  const userId = await requireAuth();
  await db
    .delete(schema.storyQuestionLinks)
    .where(
      and(
        eq(schema.storyQuestionLinks.id, linkId),
        eq(schema.storyQuestionLinks.userId, userId),
      ),
    );
  revalidatePath("/", "layout");
}
