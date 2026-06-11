"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Link2, X } from "lucide-react";
import { linkStoryToQuestion, unlink, updateLink } from "@/lib/actions/links";
import type { StoryLinkDetail } from "@/lib/actions/stories";
import type { QuestionOption } from "@/components/stories/StoryEditor";
import { Input } from "@/components/ui/input";

export function QuestionLinker({
  storyId,
  links,
  allQuestions,
}: {
  storyId: string;
  links: StoryLinkDetail[];
  allQuestions: QuestionOption[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [search, setSearch] = useState("");

  const linkedIds = useMemo(
    () => new Set(links.map((l) => l.questionId)),
    [links],
  );

  const candidates = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return allQuestions
      .filter((question) => !linkedIds.has(question.id))
      .filter((question) => question.text.toLowerCase().includes(q))
      .slice(0, 6);
  }, [search, allQuestions, linkedIds]);

  function addLink(questionId: string) {
    setSearch("");
    startTransition(async () => {
      await linkStoryToQuestion(storyId, questionId);
      toast.success("Linked");
      router.refresh();
    });
  }

  function removeLink(linkId: string) {
    startTransition(async () => {
      await unlink(linkId);
      router.refresh();
    });
  }

  function saveAngle(linkId: string, angle: string, prev: string) {
    if (angle === prev) return;
    startTransition(async () => {
      await updateLink(linkId, { angle });
      toast.success("Angle saved");
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      {links.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Link this story to the questions it answers — that&apos;s how you&apos;ll
          find it under pressure.
        </p>
      )}

      {links.map((l) => (
        <div key={l.id} className="space-y-1.5 rounded-lg border border-border p-2.5">
          <div className="flex items-start justify-between gap-2">
            <Link
              href={`/questions/${l.questionId}`}
              className="text-sm leading-snug hover:underline"
            >
              {l.question.text}
            </Link>
            <button
              type="button"
              aria-label="Unlink"
              onClick={() => removeLink(l.id)}
              className="text-muted-foreground transition hover:text-destructive"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground">{l.categoryName}</p>
          <Input
            defaultValue={l.angle}
            placeholder="Angle: what to lead with for this question…"
            className="h-7 text-xs"
            onBlur={(e) => saveAngle(l.id, e.target.value, l.angle)}
          />
        </div>
      ))}

      <div className="relative">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search questions to link…"
          className="h-8"
        />
        {candidates.length > 0 && (
          <div className="absolute inset-x-0 top-9 z-10 overflow-hidden rounded-lg border border-border bg-popover shadow-lg">
            {candidates.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => addLink(c.id)}
                className="flex w-full items-start gap-2 px-2.5 py-2 text-left text-xs transition hover:bg-secondary"
              >
                <Link2 className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
                <span>
                  {c.text}
                  <span className="ml-1 text-muted-foreground">
                    · {c.categoryName}
                    {c.targetName ? ` · ${c.targetName}` : ""}
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
