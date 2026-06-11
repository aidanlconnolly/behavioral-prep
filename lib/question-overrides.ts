/**
 * Per-user question-edit overlay. Seeded questions are shared global rows, so a
 * user's edits live in `question_overrides` keyed by the same questionId and are
 * applied on read. Plain server-side util (NOT a "use server" module) so the
 * sync `applyOverride` can be imported by several action files.
 */
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db/client";
import type { Question } from "@/lib/db/schema";

export type QOverride = {
  questionId: string;
  text: string | null;
  notes: string | null;
  importance: number | null;
};

/** All of a user's overrides, keyed by questionId. */
export async function overridesFor(userId: string): Promise<Map<string, QOverride>> {
  const rows = await db
    .select({
      questionId: schema.questionOverrides.questionId,
      text: schema.questionOverrides.text,
      notes: schema.questionOverrides.notes,
      importance: schema.questionOverrides.importance,
    })
    .from(schema.questionOverrides)
    .where(eq(schema.questionOverrides.userId, userId));
  return new Map(rows.map((r) => [r.questionId, r]));
}

/** Overlay a user's edits onto a question; null override columns fall back. */
export function applyOverride(q: Question, ov?: QOverride): Question {
  if (!ov) return q;
  return {
    ...q,
    text: ov.text ?? q.text,
    notes: ov.notes ?? q.notes,
    importance: ov.importance ?? q.importance,
  };
}
