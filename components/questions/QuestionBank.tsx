"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CheckCircle2, MessagesSquare } from "lucide-react";
import type { QuestionWithMeta } from "@/lib/actions/questions";
import type { Category } from "@/lib/db/schema";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MatcherPanel } from "@/components/questions/MatcherPanel";
import { AddQuestionDialog } from "@/components/questions/AddQuestionDialog";

const IMPORTANCE_DOTS: Record<number, string> = {
  3: "bg-destructive",
  2: "bg-warning",
  1: "bg-muted-foreground/40",
};

export function QuestionBank({
  categories,
  questions,
  initialCategory,
  hasAiKey,
}: {
  categories: Category[];
  questions: QuestionWithMeta[];
  initialCategory: string;
  hasAiKey: boolean;
}) {
  const [selected, setSelected] = useState(initialCategory);
  const [query, setQuery] = useState("");

  const countByCat = useMemo(() => {
    const m = new Map<string, number>();
    for (const q of questions)
      m.set(q.categorySlug, (m.get(q.categorySlug) ?? 0) + 1);
    return m;
  }, [questions]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return questions.filter((question) => {
      if (selected !== "all" && question.categorySlug !== selected) return false;
      if (q && !question.text.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [questions, selected, query]);

  // Group by category, preserving sort order from the server.
  const grouped = useMemo(() => {
    const groups: { category: string; items: QuestionWithMeta[] }[] = [];
    for (const q of filtered) {
      const last = groups[groups.length - 1];
      if (last && last.category === q.categoryName) last.items.push(q);
      else groups.push({ category: q.categoryName, items: [q] });
    }
    return groups;
  }, [filtered]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            Question bank
          </h1>
          <p className="text-sm text-muted-foreground">
            Every question type they&apos;ll throw at you — link each to a story
            or write an answer.
          </p>
        </div>
        <AddQuestionDialog categories={categories} />
      </div>

      <MatcherPanel hasAiKey={hasAiKey} />

      <div className="flex flex-wrap gap-1.5">
        <CategoryChip
          label="All"
          count={questions.length}
          active={selected === "all"}
          onClick={() => setSelected("all")}
        />
        {categories.map((c) => (
          <CategoryChip
            key={c.slug}
            label={c.name}
            count={countByCat.get(c.slug) ?? 0}
            active={selected === c.slug}
            onClick={() => setSelected(c.slug)}
          />
        ))}
      </div>

      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search questions…"
        className="max-w-sm"
      />

      {grouped.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
            <MessagesSquare className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No questions match. Try another category or add your own.
            </p>
          </CardContent>
        </Card>
      ) : (
        grouped.map((group) => (
          <section key={group.category}>
            <h2 className="mb-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              {group.category}
            </h2>
            <Card size="sm">
              <CardContent className="divide-y divide-border">
                {group.items.map((q) => (
                  <Link
                    key={q.id}
                    href={`/questions/${q.id}`}
                    className="flex items-center gap-3 py-2.5 transition hover:bg-secondary/40"
                  >
                    <span
                      title={`Importance ${q.importance}`}
                      className={`h-1.5 w-1.5 shrink-0 rounded-full ${IMPORTANCE_DOTS[q.importance] ?? IMPORTANCE_DOTS[2]}`}
                    />
                    <span className="min-w-0 flex-1 text-sm leading-snug">
                      {q.text}
                      {q.targetName && (
                        <Badge variant="outline" className="ml-2">
                          {q.targetName}
                        </Badge>
                      )}
                    </span>
                    <span className="flex shrink-0 items-center gap-1.5">
                      {q.hasAnswer && (
                        <CheckCircle2
                          className="h-3.5 w-3.5 text-success"
                          aria-label="Has a written answer"
                        />
                      )}
                      {q.linkedStories.slice(0, 2).map((s) => (
                        <Badge
                          key={s.linkId}
                          variant="secondary"
                          className="hidden max-w-36 truncate sm:inline-flex"
                        >
                          {s.title}
                        </Badge>
                      ))}
                      {q.linkedStories.length > 2 && (
                        <Badge variant="secondary">
                          +{q.linkedStories.length - 2}
                        </Badge>
                      )}
                      {q.linkedStories.length > 0 && (
                        <Badge variant="secondary" className="tnum sm:hidden">
                          {q.linkedStories.length}
                        </Badge>
                      )}
                    </span>
                  </Link>
                ))}
              </CardContent>
            </Card>
          </section>
        ))
      )}
    </div>
  );
}

function CategoryChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-2.5 py-1 text-xs transition ${
        active
          ? "border-primary/50 bg-accent text-accent-foreground"
          : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
      }`}
    >
      {label} <span className="tnum opacity-70">{count}</span>
    </button>
  );
}
