"use client";

import { useState, useTransition } from "react";
import { Sparkles, Plus } from "lucide-react";
import { runCoach } from "@/lib/actions/ai";
import type { CoachResult } from "@/lib/ai/coach";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function CoachPanel({
  storyId,
  hasAiKey,
  currentThemes,
  onApplyTheme,
  onApplyOneLiner,
}: {
  storyId: string;
  hasAiKey: boolean;
  currentThemes: string[];
  onApplyTheme: (slug: string) => void;
  onApplyOneLiner: (text: string) => void;
}) {
  const [result, setResult] = useState<CoachResult | null>(null);
  const [isPending, startTransition] = useTransition();

  function run() {
    startTransition(async () => {
      setResult(await runCoach(storyId));
    });
  }

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Sparkles className="h-4 w-4 text-primary" /> AI story coach
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!hasAiKey ? (
          <p className="text-xs text-muted-foreground">
            Set <code className="font-mono">ANTHROPIC_API_KEY</code> to enable
            the coach.
          </p>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">
              Save your draft first, then get a read on tightness, numbers, and
              which questions this story can carry.
            </p>
            <Button size="sm" onClick={run} disabled={isPending}>
              {isPending ? "Coaching…" : result ? "Re-run coach" : "Coach this story"}
            </Button>
          </>
        )}

        {result && !result.unavailable && (
          <div className="space-y-3 text-sm">
            <p className="rounded-lg bg-secondary/60 p-2.5 leading-relaxed">
              {result.verdict}
            </p>

            {result.missingPieces.length > 0 && (
              <CoachList
                title="Missing or thin"
                items={result.missingPieces.map(
                  (m) => `${m.part.toUpperCase()}: ${m.issue}`,
                )}
                tone="destructive"
              />
            )}
            {result.quantification.length > 0 && (
              <CoachList
                title="Numbers"
                items={result.quantification}
                tone="warning"
              />
            )}
            {result.tightness.length > 0 && (
              <CoachList title="Tightness" items={result.tightness} tone="muted" />
            )}

            {result.suggestedOneLiner && (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase">
                  Suggested hook
                </p>
                <p className="rounded-lg border border-border p-2.5 text-sm italic">
                  “{result.suggestedOneLiner}”
                </p>
                <Button
                  size="xs"
                  variant="secondary"
                  onClick={() => onApplyOneLiner(result.suggestedOneLiner)}
                >
                  Use as hook
                </Button>
              </div>
            )}

            {result.suggestedCategories.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase">
                  Could answer
                </p>
                {result.suggestedCategories.map((c) => (
                  <div key={c.slug} className="flex items-start gap-2">
                    <Button
                      size="xs"
                      variant={
                        currentThemes.includes(c.slug) ? "secondary" : "outline"
                      }
                      disabled={currentThemes.includes(c.slug)}
                      onClick={() => onApplyTheme(c.slug)}
                    >
                      <Plus data-icon="inline-start" />
                      {c.slug}
                    </Button>
                    <span className="pt-0.5 text-xs text-muted-foreground">
                      {c.rationale}
                    </span>
                  </div>
                ))}
                <p className="text-[11px] text-muted-foreground">
                  Applied themes are saved when you hit Save.
                </p>
              </div>
            )}
          </div>
        )}
        {result?.unavailable && (
          <p className="text-xs text-muted-foreground">{result.verdict}</p>
        )}
      </CardContent>
    </Card>
  );
}

function CoachList({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "destructive" | "warning" | "muted";
}) {
  const toneClass =
    tone === "destructive"
      ? "text-destructive"
      : tone === "warning"
        ? "text-warning"
        : "text-muted-foreground";
  return (
    <div className="space-y-1">
      <p className={`text-xs font-semibold uppercase ${toneClass}`}>{title}</p>
      <ul className="space-y-1 text-xs text-foreground/90">
        {items.map((item, i) => (
          <li key={i} className="flex gap-1.5">
            <span className="text-muted-foreground">•</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
