"use server";

import { and, eq, isNull } from "drizzle-orm";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { db, schema } from "@/lib/db/client";
import type { AnswerKind } from "@/lib/db/schema";

/**
 * Upsert by (userId, questionId, targetId, kind). SQLite unique indexes treat
 * NULLs as distinct, so uniqueness is enforced here by lookup-then-write.
 */
export async function saveAnswer(input: {
  questionId?: string | null;
  targetId?: string | null;
  kind?: AnswerKind;
  body: string;
}): Promise<void> {
  const userId = await requireAuth();
  const questionId = input.questionId ?? null;
  const targetId = input.targetId ?? null;
  const kind = input.kind ?? "answer";
  if (!questionId && !targetId)
    throw new Error("An answer needs a question or a target");

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

  const now = Date.now();
  const body = input.body.trim();

  if (existing.length > 0) {
    if (body === "") {
      await db
        .delete(schema.answers)
        .where(eq(schema.answers.id, existing[0].id));
    } else {
      await db
        .update(schema.answers)
        .set({ body, updatedAt: now })
        .where(eq(schema.answers.id, existing[0].id));
    }
  } else if (body !== "") {
    await db.insert(schema.answers).values({
      id: nanoid(),
      userId,
      questionId,
      targetId,
      kind,
      body,
      createdAt: now,
      updatedAt: now,
    });
  }
  revalidatePath("/", "layout");
}
