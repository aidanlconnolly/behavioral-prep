import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

/* ── Shared enums / JSON shapes ──────────────────────────────────────────── */

export type CategoryKind = "identity" | "motivation" | "behavioral" | "closing";
export type StoryStatus = "draft" | "polished" | "memorized";
export type TargetKind = "company" | "industry";
export type RefType = "story" | "question";
export type AnswerKind = "answer" | "pitch" | "talking_points";

/** Serialized ts-fsrs card (Dates as ISO strings). */
export type FsrsCardState = {
  due: string;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  reps: number;
  lapses: number;
  state: number;
  last_review?: string;
};

/* ── Auth ────────────────────────────────────────────────────────────────── */

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: integer("created_at").notNull(),
});

/* ── Question taxonomy (categories are seeded + global) ─────────────────── */

export const categories = sqliteTable(
  "categories",
  {
    id: text("id").primaryKey(), // stable, e.g. "cat-leadership"
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    kind: text("kind").$type<CategoryKind>().notNull(),
    // false for intro / why_x / questions_for_them — they need written
    // answers, not STAR stories, so they're excluded from the story-gap matrix.
    expectsStory: integer("expects_story", { mode: "boolean" })
      .notNull()
      .default(true),
    order: integer("order").notNull().default(0),
  },
  (t) => [uniqueIndex("categories_slug_idx").on(t.slug)],
);

/** Seeded rows have userId NULL; user-added rows carry the owner's id. */
export const questions = sqliteTable(
  "questions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id"), // null = seeded/global
    categoryId: text("category_id").notNull(),
    targetId: text("target_id"), // set = per-company/industry variant
    text: text("text").notNull(),
    importance: integer("importance").notNull().default(2), // 1 low / 2 med / 3 high
    notes: text("notes").notNull().default(""),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [
    index("questions_category_idx").on(t.categoryId),
    index("questions_user_idx").on(t.userId),
    index("questions_target_idx").on(t.targetId),
  ],
);

/**
 * Per-user edits overlaid on a question — the way seeded (global) questions
 * become editable without touching the shared row. Keyed by the SAME
 * questionId, so existing links / answers / cards stay valid; a null column
 * falls back to the question's own value. Not touched by the seed script, so
 * edits survive reseeds. Deleting the row reverts to the original.
 */
export const questionOverrides = sqliteTable(
  "question_overrides",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    questionId: text("question_id").notNull(),
    text: text("text"),
    notes: text("notes"),
    importance: integer("importance"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (t) => [uniqueIndex("qoverride_user_question_idx").on(t.userId, t.questionId)],
);

/* ── Targets: the companies & industries you're recruiting for ──────────── */

export const targets = sqliteTable(
  "targets",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    kind: text("kind").$type<TargetKind>().notNull(),
    name: text("name").notNull(),
    role: text("role").notNull().default(""),
    notes: text("notes").notNull().default(""),
    whyThem: text("why_them").notNull().default(""),
    status: text("status").$type<"active" | "archived">().notNull().default("active"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (t) => [index("targets_user_kind_idx").on(t.userId, t.kind)],
);

/**
 * Written answers. Three shapes:
 *  - generic answer to a question:        questionId set, targetId null
 *  - target-specific answer to a question: both set ("Why us?" for KKR)
 *  - free-form target pitch:               targetId set, questionId null
 * Uniqueness of (userId, questionId, targetId) is enforced in app code —
 * SQLite unique indexes treat NULLs as distinct.
 */
export const answers = sqliteTable(
  "answers",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    questionId: text("question_id"),
    targetId: text("target_id"),
    kind: text("kind").$type<AnswerKind>().notNull().default("answer"),
    body: text("body").notNull(),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (t) => [
    index("answers_user_question_idx").on(t.userId, t.questionId),
    index("answers_user_target_idx").on(t.userId, t.targetId),
  ],
);

/* ── The STAR story library ──────────────────────────────────────────────── */

export const stories = sqliteTable(
  "stories",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    title: text("title").notNull(),
    oneLiner: text("one_liner").notNull().default(""), // the 10-second hook
    situation: text("situation").notNull().default(""),
    task: text("task").notNull().default(""),
    action: text("action").notNull().default(""),
    result: text("result").notNull().default(""),
    metrics: text("metrics").notNull().default(""), // headline numbers
    context: text("context").notNull().default(""), // employer/role it comes from
    themes: text("themes", { mode: "json" }).$type<string[]>().notNull().default([]), // category slugs
    status: text("status").$type<StoryStatus>().notNull().default("draft"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (t) => [index("stories_user_status_idx").on(t.userId, t.status)],
);

/** Story ↔ question mapping, with a per-pairing angle note. */
export const storyQuestionLinks = sqliteTable(
  "story_question_links",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    storyId: text("story_id").notNull(),
    questionId: text("question_id").notNull(),
    angle: text("angle").notNull().default(""), // "lead with X, compress the setup"
    isPrimary: integer("is_primary", { mode: "boolean" }).notNull().default(false),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [
    uniqueIndex("links_user_story_question_idx").on(t.userId, t.storyId, t.questionId),
    index("links_user_question_idx").on(t.userId, t.questionId),
    index("links_user_story_idx").on(t.userId, t.storyId),
  ],
);

/* ── Spaced repetition ───────────────────────────────────────────────────── */

export const fsrsCards = sqliteTable(
  "fsrs_cards",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    refType: text("ref_type").$type<RefType>().notNull(),
    refId: text("ref_id").notNull(),
    fsrsDue: integer("fsrs_due").notNull(), // ms — cheap WHERE due <= now
    fsrsState: text("fsrs_state", { mode: "json" }).$type<FsrsCardState>().notNull(),
    reps: integer("reps").notNull().default(0),
    lapses: integer("lapses").notNull().default(0),
    lastReviewedAt: integer("last_reviewed_at"),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [
    uniqueIndex("fsrs_user_ref_idx").on(t.userId, t.refType, t.refId),
    index("fsrs_user_due_idx").on(t.userId, t.fsrsDue),
  ],
);

/** One row per self-rated rep — powers streak + history. */
export const practiceLog = sqliteTable(
  "practice_log",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    refType: text("ref_type").$type<RefType>().notNull(),
    refId: text("ref_id").notNull(),
    rating: integer("rating").notNull(), // 1–4
    createdAt: integer("created_at").notNull(),
  },
  (t) => [index("practice_user_created_idx").on(t.userId, t.createdAt)],
);

/* ── Row types ───────────────────────────────────────────────────────────── */

export type User = typeof users.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Question = typeof questions.$inferSelect;
export type QuestionOverride = typeof questionOverrides.$inferSelect;
export type Target = typeof targets.$inferSelect;
export type Answer = typeof answers.$inferSelect;
export type Story = typeof stories.$inferSelect;
export type StoryQuestionLink = typeof storyQuestionLinks.$inferSelect;
export type FsrsCardRow = typeof fsrsCards.$inferSelect;
export type PracticeLogRow = typeof practiceLog.$inferSelect;

export const STORY_STATUS_LABELS: Record<StoryStatus, string> = {
  draft: "Draft",
  polished: "Polished",
  memorized: "Memorized",
};

export const IMPORTANCE_LABELS: Record<number, string> = {
  1: "Occasional",
  2: "Common",
  3: "Must-have",
};
