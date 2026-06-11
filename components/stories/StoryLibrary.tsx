"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BookOpen, Link2, Plus } from "lucide-react";
import { createStoryAndRedirect, type StoryWithLinkCount } from "@/lib/actions/stories";
import { STORY_STATUS_LABELS, type StoryStatus } from "@/lib/db/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const STATUS_TONES: Record<StoryStatus, string> = {
  draft: "border-border text-muted-foreground",
  polished: "border-warning/50 text-warning",
  memorized: "border-success/50 text-success",
};

export function StoryLibrary({
  stories,
  themeOptions,
}: {
  stories: StoryWithLinkCount[];
  themeOptions: { slug: string; name: string }[];
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StoryStatus | "all">("all");
  const [theme, setTheme] = useState<string>("all");

  const themeName = useMemo(
    () => new Map(themeOptions.map((t) => [t.slug, t.name])),
    [themeOptions],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return stories.filter((s) => {
      if (status !== "all" && s.status !== status) return false;
      if (theme !== "all" && !s.themes.includes(theme)) return false;
      if (
        q &&
        ![s.title, s.oneLiner, s.context, s.situation, s.action, s.result]
          .join(" ")
          .toLowerCase()
          .includes(q)
      )
        return false;
      return true;
    });
  }, [stories, query, status, theme]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            Stories
          </h1>
          <p className="text-sm text-muted-foreground">
            Your STAR bank — aim for 20–30, then polish and memorize.
          </p>
        </div>
        <form action={createStoryAndRedirect}>
          <Button type="submit">
            <Plus data-icon="inline-start" /> New story
          </Button>
        </form>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search stories…"
          className="max-w-xs"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as StoryStatus | "all")}
          className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm outline-none dark:bg-input/30"
        >
          <option value="all">All statuses</option>
          <option value="draft">Draft</option>
          <option value="polished">Polished</option>
          <option value="memorized">Memorized</option>
        </select>
        <select
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm outline-none dark:bg-input/30"
        >
          <option value="all">All themes</option>
          {themeOptions.map((t) => (
            <option key={t.slug} value={t.slug}>
              {t.name}
            </option>
          ))}
        </select>
        <span className="ml-auto text-xs text-muted-foreground tnum">
          {filtered.length} of {stories.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
            <BookOpen className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {stories.length === 0
                ? "No stories yet — hit “New story” and braindump your first one."
                : "Nothing matches that filter."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((s) => (
            <Link key={s.id} href={`/stories/${s.id}`}>
              <Card
                size="sm"
                className="h-full transition hover:ring-primary/40"
              >
                <CardContent className="flex h-full flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-medium leading-snug">{s.title}</h3>
                    <Badge
                      variant="outline"
                      className={STATUS_TONES[s.status]}
                    >
                      {STORY_STATUS_LABELS[s.status]}
                    </Badge>
                  </div>
                  {s.oneLiner && (
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {s.oneLiner}
                    </p>
                  )}
                  <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-1">
                    {s.themes.slice(0, 3).map((t) => (
                      <Badge key={t} variant="secondary">
                        {themeName.get(t) ?? t}
                      </Badge>
                    ))}
                    {s.themes.length > 3 && (
                      <Badge variant="secondary">+{s.themes.length - 3}</Badge>
                    )}
                    <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground tnum">
                      <Link2 className="h-3 w-3" />
                      {s.linkCount}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
