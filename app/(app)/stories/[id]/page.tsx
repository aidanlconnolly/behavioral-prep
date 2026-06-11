import { notFound } from "next/navigation";
import { getStory } from "@/lib/actions/stories";
import { listCategories, listQuestionsWithMeta } from "@/lib/actions/questions";
import { isInDeck } from "@/lib/actions/practice";
import { hasAnthropicKey } from "@/lib/anthropic";
import { StoryEditor } from "@/components/stories/StoryEditor";

export const dynamic = "force-dynamic";

export default async function StoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [data, categories, bank, inDeck] = await Promise.all([
    getStory(id),
    listCategories(),
    listQuestionsWithMeta(),
    isInDeck("story", id),
  ]);
  if (!data) notFound();

  return (
    <StoryEditor
      story={data.story}
      links={data.links}
      themeOptions={categories
        .filter((c) => c.expectsStory)
        .map((c) => ({ slug: c.slug, name: c.name }))}
      allQuestions={bank.questions.map((q) => ({
        id: q.id,
        text: q.text,
        categoryName: q.categoryName,
        targetName: q.targetName,
      }))}
      inDeck={inDeck}
      hasAiKey={hasAnthropicKey()}
    />
  );
}
