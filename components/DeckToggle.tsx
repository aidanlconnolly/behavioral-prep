"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Layers, Check } from "lucide-react";
import { addToDeck, removeFromDeck } from "@/lib/actions/practice";
import { Button } from "@/components/ui/button";
import type { RefType } from "@/lib/db/schema";

export function DeckToggle({
  refType,
  refId,
  inDeck: initialInDeck,
}: {
  refType: RefType;
  refId: string;
  inDeck: boolean;
}) {
  const [inDeck, setInDeck] = useState(initialInDeck);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function toggle() {
    const next = !inDeck;
    setInDeck(next);
    startTransition(async () => {
      if (next) {
        await addToDeck(refType, refId);
        toast.success("Added to your review deck");
      } else {
        await removeFromDeck(refType, refId);
        toast("Removed from your review deck");
      }
      router.refresh();
    });
  }

  return (
    <Button
      type="button"
      variant={inDeck ? "secondary" : "outline"}
      size="sm"
      disabled={isPending}
      onClick={toggle}
    >
      {inDeck ? (
        <Check data-icon="inline-start" />
      ) : (
        <Layers data-icon="inline-start" />
      )}
      {inDeck ? "In review deck" : "Add to review deck"}
    </Button>
  );
}
