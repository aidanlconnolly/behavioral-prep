import Link from "next/link";
import { ArrowRight, BookOpen, Layers, MessagesSquare } from "lucide-react";
import { getDeckStats } from "@/lib/actions/practice";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function PracticePage() {
  const stats = await getDeckStats();
  const total = {
    due: stats.story.due + stats.question.due,
    total: stats.story.total + stats.question.total,
  };

  const decks = [
    {
      key: "all",
      title: "Everything",
      icon: Layers,
      due: total.due,
      count: total.total,
      blurb: "Stories and questions together, hardest-due first.",
    },
    {
      key: "story",
      title: "Stories",
      icon: BookOpen,
      due: stats.story.due,
      count: stats.story.total,
      blurb: "Recite the full STAR from just the title.",
    },
    {
      key: "question",
      title: "Questions",
      icon: MessagesSquare,
      due: stats.question.due,
      count: stats.question.total,
      blurb: "See a question, recall which story and which angle.",
    },
  ] as const;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          Practice
        </h1>
        <p className="text-sm text-muted-foreground">
          Spaced repetition — rate yourself honestly and the weak ones come back
          sooner. Add stories and questions to the deck from their pages.
        </p>
      </div>

      {total.total === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
            <Layers className="h-8 w-8 text-muted-foreground" />
            <p className="max-w-sm text-sm text-muted-foreground">
              Your deck is empty. Open a story or question and hit
              “Add to review deck” to start drilling.
            </p>
            <Button
              nativeButton={false}
              render={<Link href="/stories" />}
              variant="outline"
              size="sm"
            >
              Go to stories <ArrowRight data-icon="inline-end" />
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-3">
          {decks.map((d) => {
            const Icon = d.icon;
            return (
              <Card key={d.key} size="sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Icon className="h-4 w-4 text-primary" /> {d.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex h-full flex-col gap-2">
                  <div className="text-2xl font-bold tnum">
                    {d.due}
                    <span className="text-sm font-normal text-muted-foreground">
                      {" "}
                      due / {d.count}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{d.blurb}</p>
                  <Button
                    size="sm"
                    className="mt-auto w-fit"
                    disabled={d.due === 0}
                    nativeButton={d.due === 0}
                    render={
                      d.due === 0 ? undefined : (
                        <Link href={`/practice/session?deck=${d.key}`} />
                      )
                    }
                  >
                    {d.due === 0 ? "Nothing due" : "Start"}
                    {d.due > 0 && <ArrowRight data-icon="inline-end" />}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
