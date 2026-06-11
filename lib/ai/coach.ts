/**
 * AI story coach. Reviews a STAR story draft via a forced tool call (strict
 * JSON), validated with zod. Server-only — never import from client components.
 */
import { z } from "zod";
import { anthropic, hasAnthropicKey, MODEL_SMART } from "@/lib/anthropic";
import type { Category, Story } from "@/lib/db/schema";

const PERSONA = `You are a senior MBA behavioral-interview coach preparing a candidate for private-equity portfolio-operations and tech internship interviews. You know what KKR Capstone, Bain Capital, Vista, Amazon, and Google interviewers reward: a crisp hook, Action-heavy narration in the first person ("I", not "we"), a quantified Result, and a 90-second total runtime. You are demanding but constructive. Penalize long wind-ups, vague outcomes, and missing numbers. Be specific and concise.`;

const CoachSchema = z.object({
  verdict: z.string(),
  tightness: z.array(z.string()),
  quantification: z.array(z.string()),
  missingPieces: z.array(
    z.object({
      part: z.enum(["hook", "situation", "task", "action", "result"]),
      issue: z.string(),
    }),
  ),
  suggestedOneLiner: z.string(),
  suggestedCategories: z.array(
    z.object({ slug: z.string(), rationale: z.string() }),
  ),
});

export type CoachResult = z.infer<typeof CoachSchema> & {
  unavailable?: boolean;
};

export async function coachStory(
  story: Story,
  categories: Category[],
): Promise<CoachResult> {
  if (!hasAnthropicKey()) {
    return {
      verdict:
        "AI coach is offline — set ANTHROPIC_API_KEY in the environment to enable it.",
      tightness: [],
      quantification: [],
      missingPieces: [],
      suggestedOneLiner: "",
      suggestedCategories: [],
      unavailable: true,
    };
  }

  const storyCategories = categories.filter((c) => c.expectsStory);
  const categoryList = storyCategories
    .map((c) => `- ${c.slug}: ${c.name} — ${c.description}`)
    .join("\n");

  const tool = {
    name: "submit_review",
    description: "Return the structured review of the candidate's STAR story.",
    input_schema: {
      type: "object" as const,
      properties: {
        verdict: {
          type: "string",
          description: "2-3 sentence overall read on the story as delivered",
        },
        tightness: {
          type: "array",
          items: { type: "string" },
          description:
            "specific wordiness / setup-too-long / buried-lede flags (empty if tight)",
        },
        quantification: {
          type: "array",
          items: { type: "string" },
          description: "where numbers are missing, weak, or unconvincing",
        },
        missingPieces: {
          type: "array",
          items: {
            type: "object",
            properties: {
              part: {
                type: "string",
                enum: ["hook", "situation", "task", "action", "result"],
              },
              issue: { type: "string" },
            },
            required: ["part", "issue"],
          },
          description: "STAR components that are absent or underdeveloped",
        },
        suggestedOneLiner: {
          type: "string",
          description: "a punchy 10-second hook for this story, in first person",
        },
        suggestedCategories: {
          type: "array",
          items: {
            type: "object",
            properties: {
              slug: { type: "string", description: "must be one of the listed slugs" },
              rationale: { type: "string", description: "one sentence" },
            },
            required: ["slug", "rationale"],
          },
          description:
            "question categories this story can credibly answer (best 2-4)",
        },
      },
      required: [
        "verdict",
        "tightness",
        "quantification",
        "missingPieces",
        "suggestedOneLiner",
        "suggestedCategories",
      ],
    },
  };

  const userMsg = [
    `STORY TITLE: ${story.title}`,
    story.context ? `WHERE IT'S FROM: ${story.context}` : "",
    story.oneLiner ? `CURRENT HOOK: ${story.oneLiner}` : "CURRENT HOOK: (none yet)",
    `\nSITUATION:\n${story.situation || "(empty)"}`,
    `\nTASK:\n${story.task || "(empty)"}`,
    `\nACTION:\n${story.action || "(empty)"}`,
    `\nRESULT:\n${story.result || "(empty)"}`,
    story.metrics ? `\nKEY NUMBERS: ${story.metrics}` : "",
    `\nQUESTION CATEGORIES (use these slugs for suggestedCategories):\n${categoryList}`,
    `\nReview the story. Be concrete: quote the weak phrases, name the missing numbers.`,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const msg = await anthropic().messages.create({
      model: MODEL_SMART,
      max_tokens: 1500,
      system: PERSONA,
      tools: [tool],
      tool_choice: { type: "tool", name: "submit_review" },
      messages: [{ role: "user", content: userMsg }],
    });

    const block = msg.content.find((b) => b.type === "tool_use");
    if (!block || block.type !== "tool_use") throw new Error("no tool_use block");
    const parsed = CoachSchema.parse(block.input);

    // Keep only real category slugs.
    const validSlugs = new Set(storyCategories.map((c) => c.slug));
    parsed.suggestedCategories = parsed.suggestedCategories.filter((s) =>
      validSlugs.has(s.slug),
    );
    return parsed;
  } catch (err) {
    console.error("coachStory failed:", err);
    return {
      verdict: "The coach hit an error — try again in a moment.",
      tightness: [],
      quantification: [],
      missingPieces: [],
      suggestedOneLiner: "",
      suggestedCategories: [],
      unavailable: true,
    };
  }
}
