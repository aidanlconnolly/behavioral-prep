import { notFound } from "next/navigation";
import { getQuestion } from "@/lib/actions/questions";
import { listStories } from "@/lib/actions/stories";
import { isInDeck } from "@/lib/actions/practice";
import { QuestionDetailView } from "@/components/questions/QuestionDetailView";

export const dynamic = "force-dynamic";

export default async function QuestionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [detail, stories, inDeck] = await Promise.all([
    getQuestion(id),
    listStories(),
    isInDeck("question", id),
  ]);
  if (!detail) notFound();

  return (
    <QuestionDetailView
      detail={detail}
      allStories={stories.map((s) => ({
        id: s.id,
        title: s.title,
        oneLiner: s.oneLiner,
      }))}
      inDeck={inDeck}
    />
  );
}
