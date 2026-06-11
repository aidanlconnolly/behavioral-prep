# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**Behavioral Prep** — a personal STAR-story bank for MBA internship behavioral interviews (PE operations + tech). You write 20–30 STAR stories, map them to a seeded question bank, keep per-company / per-industry "why" answers, and drill everything with spaced repetition. Multi-user email/password auth; deployed personally on Vercel. Dev port **5960**.

Sibling app to `../PeOps-Prep` and `../foundry` — it reuses their patterns (lazy Turso client, FSRS wrapper, AppShell nav, shadcn/ui setup, foundry's auth). When extending, check how those apps solved the same problem first.

## Commands

```bash
# node is at /opt/homebrew/bin/node — prefix npm/npx with it
PATH=/opt/homebrew/bin:$PATH npm run dev      # Next dev server on 5960
PATH=/opt/homebrew/bin:$PATH npm run build    # TS strict check + Next build
PATH=/opt/homebrew/bin:$PATH npm run lint

# DB — source env first (local dev uses file:local.db)
set -a && source .env.local && set +a
PATH=/opt/homebrew/bin:$PATH npm run db:push   # drizzle-kit push (schema → DB)
PATH=/opt/homebrew/bin:$PATH npm run db:studio # drizzle-kit studio (GUI)
PATH=/opt/homebrew/bin:$PATH npm run seed      # load categories + question bank (tsx scripts/seed.ts)
```

There is no test suite. Verify changes by building + clicking through the app.

**Local dev gotcha:** `TURSO_AUTH_TOKEN` must be **non-empty** even for `file:local.db`, or `drizzle-kit push` fails. `.env.local` needs `TURSO_DATABASE_URL=file:local.db`, `TURSO_AUTH_TOKEN=local`, `AUTH_SECRET=<32-byte hex>`, and optional `ANTHROPIC_API_KEY`.

## Stack

Next.js 16 (App Router), React 19, TypeScript strict, Tailwind v4 + shadcn/ui (Base UI primitives; theme tokens in `app/globals.css` via `@theme inline` — **no `tailwind.config.ts`**), Turso (libSQL) + Drizzle ORM, `ts-fsrs`, Anthropic SDK, `jose` + `bcryptjs` (auth), `sonner`, `next-themes` (dark default), `lucide-react`, `zod`.

> Next 16 specifics: middleware lives in **`proxy.ts`** at the repo root with the export named `proxy` (not `middleware.ts`). `cookies()`, `params`, and `searchParams` are async — `await` them.

## Architecture

### The core data model (`lib/db/schema.ts`)

The whole app hangs on a few modeling decisions that aren't obvious from the table list:

- **`categories`** are seeded and global (no `userId`). `expectsStory` splits them in two: behavioral categories (leadership, conflict, influence…) expect a linked STAR **story**; identity/motivation/closing categories (intro, why_industry, why_company, strengths, questions_for_them) expect a written **answer** instead. The dashboard coverage matrix renders these two groups differently.
- **`questions`** are seeded (`userId IS NULL`) **and** user-added (`userId` set) in the same table. A non-null `targetId` makes a question a per-company/industry variant. Seeded rows are immutable; actions only ever update/delete rows where `userId = me`.
- **`stories` ↔ `questions`** is many-to-many via **`storyQuestionLinks`**, and the link itself carries an `angle` note ("lead with X, compress the setup") + an `isPrimary` "go-to" flag. This is the answer to "they asked X — which story, and how do I spin it." Category coverage is *derived* (a category is covered if any of its questions has a link), with `stories.themes` (an array of category slugs) as a coarser secondary signal.
- **`answers`** is one table for three shapes — generic answer to a question (`questionId` only), target-specific answer (`questionId` + `targetId`, e.g. "Why us?" for KKR), and a free-form target pitch (`targetId` + `kind:"pitch"`, no question). **Uniqueness is enforced in app code, not by a unique index** — SQLite treats NULLs as distinct, so `saveAnswer` does lookup-then-upsert (and deletes the row when the body is emptied).
- **`fsrsCards`** is polymorphic via `refType` (`"story" | "question"`) + `refId`, unique on `(userId, refType, refId)`, with `fsrsDue` denormalized to an integer ms for cheap `WHERE due <= now`.

### Backend = server actions

All mutations and reads are `"use server"` functions in `lib/actions/*.ts` (`stories`, `questions`, `links`, `targets`, `answers`, `practice`, `dashboard`, `ai`, `auth`). **There are no `app/api/` route handlers** — even the AI features are plain server actions (no streaming needed). Every action starts with `const userId = await requireAuth()` and scopes its queries by `userId`. Deletes cascade in app code (e.g. deleting a story also clears its links, FSRS card, and practice-log rows).

### DB client

`lib/db/client.ts` lazily initializes Turso+Drizzle behind a `Proxy` so env validation is deferred until first use — this is what keeps Vercel build-time route discovery from throwing on missing env vars. **Every dynamic page must `export const dynamic = "force-dynamic"`** for the same reason.

### Auth

Copied from `../foundry`: `proxy.ts` redirects unauthenticated requests to `/login` (public paths: `/login`, `/register`); `lib/auth.ts` signs/reads a `__session` jose JWT cookie and exposes `requireAuth()` / `getSession()`; `lib/actions/auth.ts` has register/login/logout/changePassword with bcrypt. Auth pages live **outside** the `app/(app)/` route group; the group's `layout.tsx` wraps everything else in `AppShell`.

### FSRS practice

`lib/srs.ts` (copied verbatim from PeOps-Prep — don't rewrite, the `deserialize` shim needs `learning_steps: 0`) wraps `ts-fsrs`. `lib/actions/practice.ts` builds review cards by hydrating story/question content: a **story** card shows title→full STAR; a **question** card shows the question→your saved answer + linked stories with their angles. `rateCard` applies the rating, reschedules, and logs to `practiceLog` (which drives the dashboard streak).

### AI (degrades gracefully without a key)

`lib/anthropic.ts` exposes `hasAnthropicKey()` and `MODEL_SMART = "claude-sonnet-4-6"`. `lib/ai/coach.ts` (critiques a STAR draft) and `lib/ai/match.ts` (ranks stories against a pasted question) both use a **forced tool call** validated with `zod`, and return `{ unavailable: true, ... }` when the key is absent. `lib/ai/*` is server-only — never import it into a client component; instead pass a `hasAiKey` boolean prop down (see `StoryEditor` → `CoachPanel`, `QuestionBank` → `MatcherPanel`).

### Theme

Dark by default (`next-themes`, `defaultTheme="dark"`), indigo primary. All tokens are OKLCH CSS variables in `app/globals.css` under `:root` (light) and `.dark`, surfaced to Tailwind via `@theme inline`. Use the `font-heading` (serif) class for page titles.

## Seed content

`seed/categories.ts` (16 categories) + `seed/questions.ts` (84 questions) → loaded by `scripts/seed.ts`. The seed uses **stable ids** (`cat-*`, `q-<category>-<n>`) and the script deletes only `userId IS NULL` question rows, so reseeding never breaks user links/answers that point at seeded questions. Categories are fully seed-owned (the script wipes and reinserts them). To extend the bank, edit the typed seed files and re-run `npm run seed`.

## Deployment

Live on **Vercel** at **https://behavioral-prep.vercel.app** (project `behavioral-prep`, GitHub `aidanlconnolly/behavioral-prep` auto-deploys from `main`). Its own dedicated Turso DB `behavioral-prep`. Required prod env: `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `AUTH_SECRET`, `ANTHROPIC_API_KEY`. Env changes need a fresh `vercel --prod` to take effect. Schema/seed changes ship to prod by pointing `TURSO_DATABASE_URL`/`TURSO_AUTH_TOKEN` at the prod DB and running `drizzle-kit push` + `npm run seed`.
