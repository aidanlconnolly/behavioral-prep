"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import {
  deleteStory,
  updateStory,
  type StoryLinkDetail,
} from "@/lib/actions/stories";
import type { Story, StoryStatus } from "@/lib/db/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { DeckToggle } from "@/components/DeckToggle";
import { CoachPanel } from "@/components/stories/CoachPanel";
import { QuestionLinker } from "@/components/stories/QuestionLinker";

export type QuestionOption = {
  id: string;
  text: string;
  categoryName: string;
  targetName: string | null;
};

export function StoryEditor({
  story,
  links,
  themeOptions,
  allQuestions,
  inDeck,
  hasAiKey,
}: {
  story: Story;
  links: StoryLinkDetail[];
  themeOptions: { slug: string; name: string }[];
  allQuestions: QuestionOption[];
  inDeck: boolean;
  hasAiKey: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState(story.title);
  const [oneLiner, setOneLiner] = useState(story.oneLiner);
  const [context, setContext] = useState(story.context);
  const [situation, setSituation] = useState(story.situation);
  const [task, setTask] = useState(story.task);
  const [action, setAction] = useState(story.action);
  const [result, setResult] = useState(story.result);
  const [metrics, setMetrics] = useState(story.metrics);
  const [themes, setThemes] = useState<string[]>(story.themes);
  const [status, setStatus] = useState<StoryStatus>(story.status);

  function save() {
    startTransition(async () => {
      await updateStory(story.id, {
        title: title.trim() || "Untitled story",
        oneLiner,
        context,
        situation,
        task,
        action,
        result,
        metrics,
        themes,
        status,
      });
      toast.success("Story saved");
      router.refresh();
    });
  }

  function toggleTheme(slug: string) {
    setThemes((prev) =>
      prev.includes(slug) ? prev.filter((t) => t !== slug) : [...prev, slug],
    );
  }

  function confirmDelete() {
    if (!window.confirm("Delete this story? Links and review history go with it."))
      return;
    startTransition(async () => {
      await deleteStory(story.id);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href="/stories"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" /> Stories
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <DeckToggle refType="story" refId={story.id} inDeck={inDeck} />
          <Button onClick={save} disabled={isPending}>
            <Save data-icon="inline-start" />
            {isPending ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Left: the story itself */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Story title (e.g. “Shipyard throughput turnaround”)"
              className="h-10 text-lg font-medium"
            />
            <div className="grid gap-2 sm:grid-cols-2">
              <Input
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Where it's from (e.g. BCG — federal shipyard)"
              />
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as StoryStatus)}
                className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm outline-none dark:bg-input/30"
              >
                <option value="draft">Draft</option>
                <option value="polished">Polished</option>
                <option value="memorized">Memorized</option>
              </select>
            </div>
          </div>

          <Field
            label="Hook — the 10-second version"
            hint="What you'd say first, before the details."
            value={oneLiner}
            onChange={setOneLiner}
            rows={2}
          />
          <Field label="Situation" value={situation} onChange={setSituation} />
          <Field label="Task" value={task} onChange={setTask} />
          <Field
            label="Action"
            hint="The meat — first person, your decisions."
            value={action}
            onChange={setAction}
            rows={5}
          />
          <Field
            label="Result"
            hint="Quantified. What changed, by how much."
            value={result}
            onChange={setResult}
          />
          <div className="space-y-1.5">
            <Label>Key numbers</Label>
            <Input
              value={metrics}
              onChange={(e) => setMetrics(e.target.value)}
              placeholder="e.g. +18% throughput, $4M saved, team of 6"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Themes — which question types can this answer?</Label>
            <div className="flex flex-wrap gap-1.5">
              {themeOptions.map((t) => {
                const active = themes.includes(t.slug);
                return (
                  <button
                    key={t.slug}
                    type="button"
                    onClick={() => toggleTheme(t.slug)}
                    className={`rounded-full border px-2.5 py-1 text-xs transition ${
                      active
                        ? "border-primary/50 bg-accent text-accent-foreground"
                        : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
                    }`}
                  >
                    {t.name}
                  </button>
                );
              })}
            </div>
          </div>

          <Separator />
          <Button
            variant="destructive"
            size="sm"
            onClick={confirmDelete}
            disabled={isPending}
          >
            <Trash2 data-icon="inline-start" /> Delete story
          </Button>
        </div>

        {/* Right: coach + links */}
        <div className="space-y-4">
          <CoachPanel
            storyId={story.id}
            hasAiKey={hasAiKey}
            currentThemes={themes}
            onApplyTheme={(slug) => {
              if (!themes.includes(slug)) setThemes((p) => [...p, slug]);
            }}
            onApplyOneLiner={(text) => setOneLiner(text)}
          />

          <Card size="sm">
            <CardHeader>
              <CardTitle className="text-sm">
                Linked questions{" "}
                <Badge variant="secondary" className="ml-1 tnum">
                  {links.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <QuestionLinker
                storyId={story.id}
                links={links}
                allQuestions={allQuestions}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  value,
  onChange,
  rows = 3,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {hint && (
          <span className="font-normal text-muted-foreground">— {hint}</span>
        )}
      </Label>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
      />
    </div>
  );
}
