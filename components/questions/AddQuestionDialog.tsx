"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { createQuestion } from "@/lib/actions/questions";
import type { Category } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function AddQuestionDialog({
  categories,
  targetId,
  defaultCategorySlug,
  triggerLabel = "Add question",
}: {
  categories: Category[];
  targetId?: string;
  defaultCategorySlug?: string;
  triggerLabel?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [categoryId, setCategoryId] = useState(
    categories.find((c) => c.slug === defaultCategorySlug)?.id ??
      categories[0]?.id ??
      "",
  );
  const [importance, setImportance] = useState(2);
  const [isPending, startTransition] = useTransition();

  function submit() {
    if (!text.trim() || !categoryId) return;
    startTransition(async () => {
      await createQuestion({
        categoryId,
        text,
        importance,
        targetId,
      });
      toast.success("Question added");
      setText("");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        <Plus data-icon="inline-start" /> {triggerLabel}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a question</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Question</Label>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. Tell me about a time you turned around an underperforming team."
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm outline-none dark:bg-input/30"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Importance</Label>
              <select
                value={importance}
                onChange={(e) => setImportance(Number(e.target.value))}
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm outline-none dark:bg-input/30"
              >
                <option value={3}>Must-have</option>
                <option value={2}>Common</option>
                <option value={1}>Occasional</option>
              </select>
            </div>
          </div>
          <Button onClick={submit} disabled={isPending || !text.trim()}>
            {isPending ? "Adding…" : "Add question"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
