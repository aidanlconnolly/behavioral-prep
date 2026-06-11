"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowLeft, PartyPopper } from "lucide-react";
import { rateCard, type ReviewCard } from "@/lib/actions/practice";
import { RATING_LABELS, type Rating1to4 } from "@/lib/srs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Progress,
} from "@/components/ui/progress";

const RATING_TONES: Record<Rating1to4, string> = {
  1: "border-destructive/40 text-destructive hover:bg-destructive/10",
  2: "border-warning/40 text-warning hover:bg-warning/10",
  3: "border-primary/40 text-primary hover:bg-primary/10",
  4: "border-success/40 text-success hover:bg-success/10",
};

export function ReviewSession({ cards }: { cards: ReviewCard[] }) {
  const router = useRouter();
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [done, setDone] = useState(0);
  const [, startTransition] = useTransition();

  const card = cards[idx];
  const finished = !card;

  function rate(rating: Rating1to4) {
    if (!card) return;
    // Optimistic advance; the write happens in the background.
    const cardId = card.cardId;
    setRevealed(false);
    setIdx((i) => i + 1);
    setDone((d) => d + 1);
    startTransition(async () => {
      await rateCard(cardId, rating);
    });
  }

  if (cards.length === 0 || finished) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
        <PartyPopper className="h-10 w-10 text-primary" />
        <h1 className="font-heading text-xl font-semibold">
          {cards.length === 0 ? "Nothing due right now" : "Session complete"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {cards.length === 0
            ? "Come back when cards are due, or add more from your stories and questions."
            : `${done} ${done === 1 ? "card" : "cards"} reviewed. The schedule adjusts to how you rated yourself.`}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/practice" />}
          >
            <ArrowLeft data-icon="inline-start" /> Practice
          </Button>
          {cards.length > 0 && (
            <Button onClick={() => router.refresh()}>Check for more</Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center gap-3">
        <Link
          href="/practice"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" /> End session
        </Link>
        <div className="flex-1">
          <Progress value={(idx / cards.length) * 100} />
        </div>
        <span className="text-xs text-muted-foreground tnum">
          {idx + 1}/{cards.length}
        </span>
      </div>

      <Card>
        <CardContent className="space-y-4 py-6">
          <div className="space-y-1 text-center">
            <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              {card.front.kicker}
            </p>
            <h2 className="font-heading text-xl font-semibold leading-snug">
              {card.front.title}
            </h2>
            <p className="text-sm text-muted-foreground">{card.front.prompt}</p>
          </div>

          {!revealed ? (
            <div className="flex justify-center pt-2">
              <Button size="lg" onClick={() => setRevealed(true)}>
                Reveal
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-3 border-t border-border pt-4">
                {card.back.sections.map((s, i) => (
                  <div key={i}>
                    <p className="mb-0.5 text-xs font-semibold tracking-wider text-primary uppercase">
                      {s.label}
                    </p>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {s.body}
                    </p>
                  </div>
                ))}
                {card.back.chips.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {card.back.chips.map((c, i) => (
                      <Badge key={i} variant="secondary">
                        {c}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-4 gap-2 pt-2">
                {([1, 2, 3, 4] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => rate(r)}
                    className={`flex flex-col items-center gap-0.5 rounded-lg border bg-transparent px-2 py-2.5 text-sm font-medium transition ${RATING_TONES[r]}`}
                  >
                    {RATING_LABELS[r]}
                    <span className="text-[10px] font-normal text-muted-foreground tnum">
                      {card.intervals[r]}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
