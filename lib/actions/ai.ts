"use server";

import { and, eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { db, schema } from "@/lib/db/client";
import { coachStory, type CoachResult } from "@/lib/ai/coach";
import { matchQuestion, type MatchResult } from "@/lib/ai/match";

export async function runCoach(storyId: string): Promise<CoachResult> {
  const userId = await requireAuth();
  const [rows, categories] = await Promise.all([
    db
      .select()
      .from(schema.stories)
      .where(
        and(eq(schema.stories.id, storyId), eq(schema.stories.userId, userId)),
      )
      .limit(1),
    db.select().from(schema.categories),
  ]);
  if (rows.length === 0) throw new Error("Story not found");
  return coachStory(rows[0], categories);
}

export async function runMatch(questionText: string): Promise<MatchResult> {
  const userId = await requireAuth();
  if (!questionText.trim())
    return { matches: [], gap: "Paste a question first." };
  const stories = await db
    .select()
    .from(schema.stories)
    .where(eq(schema.stories.userId, userId));
  return matchQuestion(questionText, stories);
}
