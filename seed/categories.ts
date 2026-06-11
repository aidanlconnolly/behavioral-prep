import type { CategoryKind } from "@/lib/db/schema";

export type SeedCategory = {
  id: string;
  slug: string;
  name: string;
  description: string;
  kind: CategoryKind;
  expectsStory: boolean;
  order: number;
};

export const SEED_CATEGORIES: SeedCategory[] = [
  {
    id: "cat-intro",
    slug: "intro",
    name: "Who you are",
    description:
      "Tell-me-about-yourself, resume walkthrough, the personal pitch. Needs a tight written answer, not a story.",
    kind: "identity",
    expectsStory: false,
    order: 1,
  },
  {
    id: "cat-why-mba",
    slug: "why_mba",
    name: "Why MBA",
    description: "Why business school, why now, why your program.",
    kind: "motivation",
    expectsStory: false,
    order: 2,
  },
  {
    id: "cat-why-industry",
    slug: "why_industry",
    name: "Why this industry",
    description:
      "Why PE / PE operations / tech. Add each industry as a Target to keep tailored answers.",
    kind: "motivation",
    expectsStory: false,
    order: 3,
  },
  {
    id: "cat-why-company",
    slug: "why_company",
    name: "Why this company",
    description:
      "The firm-specific pitch. Add each company as a Target and answer these per firm.",
    kind: "motivation",
    expectsStory: false,
    order: 4,
  },
  {
    id: "cat-career-goals",
    slug: "career_goals",
    name: "Career goals",
    description: "Five-year plan, short/long-term goals, how this role fits.",
    kind: "motivation",
    expectsStory: false,
    order: 5,
  },
  {
    id: "cat-leadership",
    slug: "leadership",
    name: "Leadership",
    description:
      "Leading teams, leading through pressure or ambiguity, leading people senior to you.",
    kind: "behavioral",
    expectsStory: true,
    order: 6,
  },
  {
    id: "cat-teamwork",
    slug: "teamwork",
    name: "Teamwork",
    description:
      "Operating inside teams: struggling teams, different working styles, building trust fast.",
    kind: "behavioral",
    expectsStory: true,
    order: 7,
  },
  {
    id: "cat-conflict",
    slug: "conflict",
    name: "Conflict & difficult people",
    description:
      "Disagreements with seniors, difficult stakeholders, pushback, unpopular messages.",
    kind: "behavioral",
    expectsStory: true,
    order: 8,
  },
  {
    id: "cat-influence",
    slug: "influence",
    name: "Influence without authority",
    description:
      "Changing minds, selling ideas, getting buy-in when nobody reports to you. The core PE-ops competency.",
    kind: "behavioral",
    expectsStory: true,
    order: 9,
  },
  {
    id: "cat-failure",
    slug: "failure",
    name: "Failure & feedback",
    description:
      "Failures, mistakes, missed goals, hard feedback — and what actually changed afterward.",
    kind: "behavioral",
    expectsStory: true,
    order: 10,
  },
  {
    id: "cat-ambiguity",
    slug: "ambiguity",
    name: "Ambiguity & pressure",
    description:
      "Incomplete information, shifting priorities, no playbook, competing deadlines.",
    kind: "behavioral",
    expectsStory: true,
    order: 11,
  },
  {
    id: "cat-analytical",
    slug: "analytical",
    name: "Analytical & judgment",
    description:
      "Complex problems, data-driven recommendations, judgment calls with ambiguous data.",
    kind: "behavioral",
    expectsStory: true,
    order: 12,
  },
  {
    id: "cat-initiative",
    slug: "initiative",
    name: "Initiative & ownership",
    description:
      "Beyond the job description: spotting opportunities, building from scratch, fixing what nobody asked you to fix.",
    kind: "behavioral",
    expectsStory: true,
    order: 13,
  },
  {
    id: "cat-ethics",
    slug: "ethics",
    name: "Ethics & integrity",
    description: "Dilemmas, pressure to cut corners, speaking up.",
    kind: "behavioral",
    expectsStory: true,
    order: 14,
  },
  {
    id: "cat-strengths",
    slug: "strengths_weaknesses",
    name: "Strengths & weaknesses",
    description:
      "Self-awareness questions. Written answers backed by story evidence.",
    kind: "identity",
    expectsStory: false,
    order: 15,
  },
  {
    id: "cat-reverse",
    slug: "questions_for_them",
    name: "Questions for them",
    description:
      "Your closing questions — sharp ones that show you understand the seat.",
    kind: "closing",
    expectsStory: false,
    order: 16,
  },
];
