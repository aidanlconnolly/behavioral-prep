import { listStories } from "@/lib/actions/stories";
import { listCategories } from "@/lib/actions/questions";
import { StoryLibrary } from "@/components/stories/StoryLibrary";

export const dynamic = "force-dynamic";

export default async function StoriesPage() {
  const [stories, categories] = await Promise.all([
    listStories(),
    listCategories(),
  ]);
  return (
    <StoryLibrary
      stories={stories}
      themeOptions={categories
        .filter((c) => c.expectsStory)
        .map((c) => ({ slug: c.slug, name: c.name }))}
    />
  );
}
