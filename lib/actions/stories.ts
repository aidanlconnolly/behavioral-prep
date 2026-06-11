"use server";

import { and, desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { db, schema } from "@/lib/db/client";
import type {
  Category,
  Question,
  Story,
  StoryQuestionLink,
  StoryStatus,
} from "@/lib/db/schema";

export type StoryWithLinkCount = Story & { linkCount: number };

export type StoryLinkDetail = StoryQuestionLink & {
  question: Question;
  categoryName: string;
};

export async function listStories(): Promise<StoryWithLinkCount[]> {
  const userId = await requireAuth();
  const [rows, links] = await Promise.all([
    db
      .select()
      .from(schema.stories)
      .where(eq(schema.stories.userId, userId))
      .orderBy(desc(schema.stories.updatedAt)),
    db
      .select({ storyId: schema.storyQuestionLinks.storyId })
      .from(schema.storyQuestionLinks)
      .where(eq(schema.storyQuestionLinks.userId, userId)),
  ]);
  const counts = new Map<string, number>();
  for (const l of links) counts.set(l.storyId, (counts.get(l.storyId) ?? 0) + 1);
  return rows.map((s) => ({ ...s, linkCount: counts.get(s.id) ?? 0 }));
}

export async function getStory(id: string): Promise<{
  story: Story;
  links: StoryLinkDetail[];
} | null> {
  const userId = await requireAuth();
  const rows = await db
    .select()
    .from(schema.stories)
    .where(and(eq(schema.stories.id, id), eq(schema.stories.userId, userId)))
    .limit(1);
  if (rows.length === 0) return null;

  const [links, categories] = await Promise.all([
    db
      .select({
        link: schema.storyQuestionLinks,
        question: schema.questions,
      })
      .from(schema.storyQuestionLinks)
      .innerJoin(
        schema.questions,
        eq(schema.storyQuestionLinks.questionId, schema.questions.id),
      )
      .where(
        and(
          eq(schema.storyQuestionLinks.userId, userId),
          eq(schema.storyQuestionLinks.storyId, id),
        ),
      ),
    db.select().from(schema.categories),
  ]);
  const catName = new Map<string, string>(
    categories.map((c: Category) => [c.id, c.name]),
  );
  return {
    story: rows[0],
    links: links.map((r) => ({
      ...r.link,
      question: r.question,
      categoryName: catName.get(r.question.categoryId) ?? "",
    })),
  };
}

/** Create an empty draft and jump straight into the editor. */
export async function createStoryAndRedirect(): Promise<void> {
  const userId = await requireAuth();
  const id = nanoid();
  const now = Date.now();
  await db.insert(schema.stories).values({
    id,
    userId,
    title: "Untitled story",
    createdAt: now,
    updatedAt: now,
  });
  redirect(`/stories/${id}`);
}

export type StoryPatch = Partial<{
  title: string;
  oneLiner: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  metrics: string;
  context: string;
  themes: string[];
  status: StoryStatus;
}>;

export async function updateStory(id: string, patch: StoryPatch): Promise<void> {
  const userId = await requireAuth();
  await db
    .update(schema.stories)
    .set({ ...patch, updatedAt: Date.now() })
    .where(and(eq(schema.stories.id, id), eq(schema.stories.userId, userId)));
  revalidatePath("/", "layout");
}

export async function deleteStory(id: string): Promise<void> {
  const userId = await requireAuth();
  await db
    .delete(schema.storyQuestionLinks)
    .where(
      and(
        eq(schema.storyQuestionLinks.userId, userId),
        eq(schema.storyQuestionLinks.storyId, id),
      ),
    );
  await db
    .delete(schema.fsrsCards)
    .where(
      and(
        eq(schema.fsrsCards.userId, userId),
        eq(schema.fsrsCards.refType, "story"),
        eq(schema.fsrsCards.refId, id),
      ),
    );
  await db
    .delete(schema.practiceLog)
    .where(
      and(
        eq(schema.practiceLog.userId, userId),
        eq(schema.practiceLog.refType, "story"),
        eq(schema.practiceLog.refId, id),
      ),
    );
  await db
    .delete(schema.stories)
    .where(and(eq(schema.stories.id, id), eq(schema.stories.userId, userId)));
  revalidatePath("/", "layout");
  redirect("/stories");
}
