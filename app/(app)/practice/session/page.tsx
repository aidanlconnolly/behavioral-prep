import { getSessionCards } from "@/lib/actions/practice";
import { ReviewSession } from "@/components/practice/ReviewSession";

export const dynamic = "force-dynamic";

export default async function SessionPage({
  searchParams,
}: {
  searchParams: Promise<{ deck?: string }>;
}) {
  const { deck } = await searchParams;
  const deckKey =
    deck === "story" || deck === "question" ? deck : ("all" as const);
  const cards = await getSessionCards(deckKey);
  return <ReviewSession cards={cards} />;
}
