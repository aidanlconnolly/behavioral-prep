import { listQuestionsWithMeta } from "@/lib/actions/questions";
import { hasAnthropicKey } from "@/lib/anthropic";
import { QuestionBank } from "@/components/questions/QuestionBank";

export const dynamic = "force-dynamic";

export default async function QuestionsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const [{ categories, questions }, { category }] = await Promise.all([
    listQuestionsWithMeta(),
    searchParams,
  ]);

  return (
    <QuestionBank
      categories={categories}
      questions={questions}
      initialCategory={category ?? "all"}
      hasAiKey={hasAnthropicKey()}
    />
  );
}
