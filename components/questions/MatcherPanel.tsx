"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Sparkles, ArrowRight } from "lucide-react";
import { runMatch } from "@/lib/actions/ai";
import type { MatchResult } from "@/lib/ai/match";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

export function MatcherPanel({ hasAiKey }: { hasAiKey: boolean }) {
  const [text, setText] = useState("");
  const [result, setResult] = useState<MatchResult | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!hasAiKey) return null;

  function run() {
    startTransition(async () => {
      setResult(await runMatch(text));
    });
  }

  return (
    <Card size="sm" className="border-primary/20 bg-accent/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Sparkles className="h-4 w-4 text-primary" /> Which story do I use?
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste any question you got asked — the matcher ranks your stories and tells you how to angle them."
            rows={2}
            className="flex-1"
          />
          <Button
            onClick={run}
            disabled={isPending || !text.trim()}
            className="sm:self-end"
          >
            {isPending ? "Matching…" : "Match"}
          </Button>
        </div>

        {result && (
          <div className="space-y-2">
            {result.matches.map((m) => (
              <Link
                key={m.storyId}
                href={`/stories/${m.storyId}`}
                className="flex items-start gap-3 rounded-lg border border-border bg-background/60 p-2.5 transition hover:border-primary/40"
              >
                <span className="mt-0.5 shrink-0 font-mono text-xs text-primary tnum">
                  {"★".repeat(Math.round(m.fit))}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium">
                    {m.storyTitle}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {m.angle}
                  </span>
                </span>
                <ArrowRight className="ml-auto mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              </Link>
            ))}
            {result.gap && (
              <p className="rounded-lg border border-warning/30 bg-warning/10 p-2.5 text-xs text-foreground/90">
                {result.gap}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
