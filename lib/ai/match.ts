/**
 * AI question→story matcher. Given an arbitrary interview question and the
 * user's story roster, returns the best-fitting stories with an angle for
 * each. Forced tool call + zod. Server-only.
 */
import { z } from "zod";
import { anthropic, hasAnthropicKey, MODEL_SMART } from "@/lib/anthropic";
import type { Story } from "@/lib/db/schema";

const MatchSchema = z.object({
  matches: z.array(
    z.object({
      storyId: z.string(),
      fit: z.number().min(1).max(5),
      angle: z.string(),
    }),
  ),
  gap: z.string().optional(),
});

export type MatchResult = {
  matches: { storyId: string; storyTitle: string; fit: number; angle: string }[];
  gap?: string;
  unavailable?: boolean;
};

export async function matchQuestion(
  questionText: string,
  stories: Story[],
): Promise<MatchResult> {
  if (!hasAnthropicKey()) {
    return {
      matches: [],
      gap: "AI matching is offline — set ANTHROPIC_API_KEY in the environment to enable it.",
      unavailable: true,
    };
  }
  if (stories.length === 0) {
    return {
      matches: [],
      gap: "You have no stories yet — write a few first, then the matcher can rank them.",
    };
  }

  const roster = stories
    .map((s) => {
      const result = s.result.length > 240 ? s.result.slice(0, 240) + "…" : s.result;
      return [
        `id: ${s.id}`,
        `title: ${s.title}`,
        s.oneLiner ? `hook: ${s.oneLiner}` : "",
        s.context ? `from: ${s.context}` : "",
        s.themes.length ? `themes: ${s.themes.join(", ")}` : "",
        s.metrics ? `numbers: ${s.metrics}` : "",
        result ? `result: ${result}` : "",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n---\n");

  const tool = {
    name: "submit_matches",
    description: "Return the best-fitting stories for the question.",
    input_schema: {
      type: "object" as const,
      properties: {
        matches: {
          type: "array",
          items: {
            type: "object",
            properties: {
              storyId: { type: "string", description: "id from the roster" },
              fit: { type: "number", description: "1 (stretch) to 5 (perfect)" },
              angle: {
                type: "string",
                description:
                  "one or two sentences: how to angle this story for THIS question — what to lead with, what to compress",
              },
            },
            required: ["storyId", "fit", "angle"],
          },
          description: "top 1-3 stories, best first; omit anything below fit 2",
        },
        gap: {
          type: "string",
          description:
            "if no story fits well (or coverage is thin), what kind of story the candidate should write",
        },
      },
      required: ["matches"],
    },
  };

  const userMsg = [
    `INTERVIEW QUESTION:\n${questionText.trim()}`,
    `\nSTORY ROSTER:\n${roster}`,
    `\nPick the stories that best answer this question for a PE-operations / tech MBA internship interview. Judge fit on substance, not keyword overlap.`,
  ].join("\n");

  try {
    const msg = await anthropic().messages.create({
      model: MODEL_SMART,
      max_tokens: 1000,
      system:
        "You are a sharp MBA interview coach who knows the candidate's full story bank and matches stories to behavioral questions.",
      tools: [tool],
      tool_choice: { type: "tool", name: "submit_matches" },
      messages: [{ role: "user", content: userMsg }],
    });

    const block = msg.content.find((b) => b.type === "tool_use");
    if (!block || block.type !== "tool_use") throw new Error("no tool_use block");
    const parsed = MatchSchema.parse(block.input);

    const byId = new Map(stories.map((s) => [s.id, s]));
    return {
      matches: parsed.matches
        .filter((m) => byId.has(m.storyId))
        .map((m) => ({
          storyId: m.storyId,
          storyTitle: byId.get(m.storyId)!.title,
          fit: m.fit,
          angle: m.angle,
        })),
      gap: parsed.gap,
    };
  } catch (err) {
    console.error("matchQuestion failed:", err);
    return {
      matches: [],
      gap: "The matcher hit an error — try again in a moment.",
      unavailable: true,
    };
  }
}
