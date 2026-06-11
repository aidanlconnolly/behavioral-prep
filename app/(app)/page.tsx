import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Building2,
  Flame,
  Layers,
} from "lucide-react";
import { getDashboard, type CoverageRow } from "@/lib/actions/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

function coverageTone(row: CoverageRow): "red" | "amber" | "green" {
  if (row.expectsStory) {
    if (row.linkedQuestionCount > 0 && row.taggedStoryCount > 0) return "green";
    if (row.linkedQuestionCount > 0 || row.taggedStoryCount > 0) return "amber";
    return "red";
  }
  if (row.questionCount === 0) return "amber";
  const pct = row.answeredQuestionCount / row.questionCount;
  if (pct >= 0.6) return "green";
  if (pct > 0) return "amber";
  return "red";
}

const TONE_DOT: Record<string, string> = {
  green: "bg-success",
  amber: "bg-warning",
  red: "bg-destructive",
};

export default async function DashboardPage() {
  const d = await getDashboard();
  const dueTotal = d.due.story + d.due.question;
  const storyRows = d.coverage.filter((c) => c.expectsStory);
  const answerRows = d.coverage.filter((c) => !c.expectsStory);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">
          Build the bank, close the gaps, drill until it&apos;s automatic.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card size="sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
              <Layers className="h-4 w-4" /> Due for review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tnum">{dueTotal}</div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {d.due.story} stories · {d.due.question} questions
            </p>
            {dueTotal > 0 && (
              <Button
                size="sm"
                className="mt-3"
                nativeButton={false}
                render={<Link href="/practice" />}
              >
                Start review <ArrowRight data-icon="inline-end" />
              </Button>
            )}
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
              <BookOpen className="h-4 w-4" /> Stories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tnum">{d.storyTotal}</div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {d.storyStatus.memorized} memorized · {d.storyStatus.polished}{" "}
              polished · {d.storyStatus.draft} drafts
            </p>
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="h-4 w-4" /> Targets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tnum">
              {d.targetCounts.company + d.targetCounts.industry}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {d.targetCounts.company} companies · {d.targetCounts.industry}{" "}
              industries
            </p>
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
              <Flame className="h-4 w-4" /> Practice
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tnum">{d.streakDays}d</div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              streak · {d.repsLast7} reps this week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Story coverage matrix */}
      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-heading text-lg font-semibold">Story coverage</h2>
          <span className="text-xs text-muted-foreground">
            tag stories with themes + link them to questions to close gaps
          </span>
        </div>
        <Card size="sm">
          <CardContent className="divide-y divide-border">
            {storyRows.map((row) => {
              const tone = coverageTone(row);
              return (
                <Link
                  key={row.categoryId}
                  href={`/questions?category=${row.slug}`}
                  className="flex items-center gap-3 py-2.5 transition hover:bg-secondary/50"
                >
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${TONE_DOT[tone]}`}
                  />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {row.name}
                  </span>
                  <span className="hidden text-xs text-muted-foreground sm:block">
                    {row.taggedStoryCount}{" "}
                    {row.taggedStoryCount === 1 ? "story" : "stories"} tagged
                  </span>
                  <Badge variant="secondary" className="tnum">
                    {row.linkedQuestionCount}/{row.questionCount} linked
                  </Badge>
                </Link>
              );
            })}
          </CardContent>
        </Card>
      </section>

      {/* Answer coverage (intro / motivation / closing) */}
      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-heading text-lg font-semibold">
            Written answers
          </h2>
          <span className="text-xs text-muted-foreground">
            intro, motivation &amp; closing questions need answers, not stories
          </span>
        </div>
        <Card size="sm">
          <CardContent className="divide-y divide-border">
            {answerRows.map((row) => {
              const tone = coverageTone(row);
              return (
                <Link
                  key={row.categoryId}
                  href={`/questions?category=${row.slug}`}
                  className="flex items-center gap-3 py-2.5 transition hover:bg-secondary/50"
                >
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${TONE_DOT[tone]}`}
                  />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {row.name}
                  </span>
                  <Badge variant="secondary" className="tnum">
                    {row.answeredQuestionCount}/{row.questionCount} answered
                  </Badge>
                </Link>
              );
            })}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
