"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { ArrowLeft, BookOpen, Save, Star, Trash2, X } from "lucide-react";
import { deleteQuestion, type QuestionDetail } from "@/lib/actions/questions";
import { saveAnswer } from "@/lib/actions/answers";
import { linkStoryToQuestion, unlink, updateLink } from "@/lib/actions/links";
import { IMPORTANCE_LABELS } from "@/lib/db/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DeckToggle } from "@/components/DeckToggle";

type StoryOption = { id: string; title: string; oneLiner: string };

export function QuestionDetailView({
  detail,
  allStories,
  inDeck,
}: {
  detail: QuestionDetail;
  allStories: StoryOption[];
  inDeck: boolean;
}) {
  const { question, category, target, answer, links, isMine } = detail;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [answerBody, setAnswerBody] = useState(answer?.body ?? "");
  const [search, setSearch] = useState("");

  const linkedIds = useMemo(() => new Set(links.map((l) => l.storyId)), [links]);
  const candidates = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return allStories
      .filter((s) => !linkedIds.has(s.id))
      .filter((s) => (s.title + " " + s.oneLiner).toLowerCase().includes(q))
      .slice(0, 6);
  }, [search, allStories, linkedIds]);

  function persistAnswer() {
    startTransition(async () => {
      await saveAnswer({
        questionId: question.id,
        targetId: question.targetId ?? null,
        body: answerBody,
      });
      toast.success("Answer saved");
      router.refresh();
    });
  }

  function addLink(storyId: string) {
    setSearch("");
    startTransition(async () => {
      await linkStoryToQuestion(storyId, question.id);
      toast.success("Story linked");
      router.refresh();
    });
  }

  function confirmDelete() {
    if (!window.confirm("Delete this question (and its links/answer)?")) return;
    startTransition(async () => {
      await deleteQuestion(question.id);
    });
  }

  const expectsStory = category?.expectsStory ?? true;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/questions"
        className="flex w-fit items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" /> Question bank
      </Link>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {category && <Badge variant="secondary">{category.name}</Badge>}
          <Badge variant="outline">
            {IMPORTANCE_LABELS[question.importance] ?? "Common"}
          </Badge>
          {target && (
            <Badge variant="outline">
              <Link href={`/targets/${target.id}`}>{target.name}</Link>
            </Badge>
          )}
          {isMine && <Badge variant="ghost">yours</Badge>}
        </div>
        <h1 className="font-heading text-xl font-semibold leading-snug">
          {question.text}
        </h1>
        {question.notes && (
          <p className="text-sm text-muted-foreground">{question.notes}</p>
        )}
        <div className="flex items-center gap-2 pt-1">
          <DeckToggle refType="question" refId={question.id} inDeck={inDeck} />
          {isMine && (
            <Button
              variant="destructive"
              size="sm"
              onClick={confirmDelete}
              disabled={isPending}
            >
              <Trash2 data-icon="inline-start" /> Delete
            </Button>
          )}
        </div>
      </div>

      {/* Written answer */}
      <Card size="sm">
        <CardHeader>
          <CardTitle className="text-sm">
            Your answer
            {!expectsStory && (
              <span className="ml-2 font-normal text-muted-foreground">
                — this one needs a written answer, not a story
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Textarea
            value={answerBody}
            onChange={(e) => setAnswerBody(e.target.value)}
            placeholder="Write the answer you'd actually give — bullet points or full prose."
            rows={5}
          />
          <Button
            size="sm"
            onClick={persistAnswer}
            disabled={isPending || answerBody === (answer?.body ?? "")}
          >
            <Save data-icon="inline-start" /> Save answer
          </Button>
        </CardContent>
      </Card>

      {/* Linked stories */}
      <Card size="sm">
        <CardHeader>
          <CardTitle className="text-sm">
            Linked stories{" "}
            <Badge variant="secondary" className="ml-1 tnum">
              {links.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {links.length === 0 && expectsStory && (
            <p className="text-xs text-muted-foreground">
              No story linked yet — search below, or use the matcher on the
              Questions page.
            </p>
          )}

          {links.map((l) => (
            <div
              key={l.id}
              className="space-y-1.5 rounded-lg border border-border p-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <Link
                  href={`/stories/${l.storyId}`}
                  className="flex items-center gap-1.5 text-sm font-medium hover:underline"
                >
                  <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                  {l.story.title}
                </Link>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    title={l.isPrimary ? "Your go-to story" : "Make go-to story"}
                    onClick={() =>
                      startTransition(async () => {
                        await updateLink(l.id, { isPrimary: !l.isPrimary });
                        router.refresh();
                      })
                    }
                    className={
                      l.isPrimary
                        ? "text-warning"
                        : "text-muted-foreground/50 transition hover:text-warning"
                    }
                  >
                    <Star
                      className="h-3.5 w-3.5"
                      fill={l.isPrimary ? "currentColor" : "none"}
                    />
                  </button>
                  <button
                    type="button"
                    aria-label="Unlink"
                    onClick={() =>
                      startTransition(async () => {
                        await unlink(l.id);
                        router.refresh();
                      })
                    }
                    className="text-muted-foreground transition hover:text-destructive"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              {l.story.oneLiner && (
                <p className="text-xs text-muted-foreground">
                  {l.story.oneLiner}
                </p>
              )}
              <Input
                defaultValue={l.angle}
                placeholder="Angle: what to lead with for this question…"
                className="h-7 text-xs"
                onBlur={(e) => {
                  if (e.target.value !== l.angle)
                    startTransition(async () => {
                      await updateLink(l.id, { angle: e.target.value });
                      toast.success("Angle saved");
                      router.refresh();
                    });
                }}
              />
            </div>
          ))}

          <div className="relative">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search your stories to link…"
              className="h-8"
            />
            {candidates.length > 0 && (
              <div className="absolute inset-x-0 top-9 z-10 overflow-hidden rounded-lg border border-border bg-popover shadow-lg">
                {candidates.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => addLink(s.id)}
                    className="flex w-full flex-col gap-0.5 px-2.5 py-2 text-left text-xs transition hover:bg-secondary"
                  >
                    <span className="font-medium">{s.title}</span>
                    {s.oneLiner && (
                      <span className="text-muted-foreground">{s.oneLiner}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
