"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Building2, Factory, Plus } from "lucide-react";
import { createTarget, type TargetWithCounts } from "@/lib/actions/targets";
import type { TargetKind } from "@/lib/db/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function TargetsView({ targets }: { targets: TargetWithCounts[] }) {
  const companies = targets.filter((t) => t.kind === "company");
  const industries = targets.filter((t) => t.kind === "industry");

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            Targets
          </h1>
          <p className="text-sm text-muted-foreground">
            The companies and industries you&apos;re recruiting for — each gets
            its own “why” answers and question variants.
          </p>
        </div>
        <AddTargetDialog />
      </div>

      <TargetSection
        title="Companies"
        icon={<Building2 className="h-4 w-4" />}
        items={companies}
        empty="Add the firms you're targeting — KKR Capstone, Bain Capital, Amazon…"
      />
      <TargetSection
        title="Industries"
        icon={<Factory className="h-4 w-4" />}
        items={industries}
        empty="Add the industries you need a “why” for — PE operations, tech, consulting…"
      />
    </div>
  );
}

function TargetSection({
  title,
  icon,
  items,
  empty,
}: {
  title: string;
  icon: React.ReactNode;
  items: TargetWithCounts[];
  empty: string;
}) {
  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
        {icon} {title}
      </h2>
      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
          {empty}
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((t) => (
            <Link key={t.id} href={`/targets/${t.id}`}>
              <Card size="sm" className="h-full transition hover:ring-primary/40">
                <CardContent className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-medium">{t.name}</h3>
                    {t.status === "archived" && (
                      <Badge variant="ghost">archived</Badge>
                    )}
                  </div>
                  {t.role && (
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  )}
                  <div className="flex gap-1.5 pt-1">
                    <Badge variant="secondary" className="tnum">
                      {t.questionCount} questions
                    </Badge>
                    <Badge variant="secondary" className="tnum">
                      {t.answerCount} answers
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function AddTargetDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<TargetKind>("company");
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [isPending, startTransition] = useTransition();

  function submit() {
    if (!name.trim()) return;
    startTransition(async () => {
      const id = await createTarget({ kind, name, role });
      setOpen(false);
      setName("");
      setRole("");
      router.push(`/targets/${id}`);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus data-icon="inline-start" /> Add target
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Add a target</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Type</Label>
            <div className="grid grid-cols-2 gap-1.5">
              {(["company", "industry"] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKind(k)}
                  className={`rounded-lg border px-3 py-2 text-sm capitalize transition ${
                    kind === k
                      ? "border-primary/50 bg-accent text-accent-foreground"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={
                kind === "company" ? "e.g. KKR Capstone" : "e.g. PE operations"
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label>Role / track (optional)</Label>
            <Input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Summer Associate — Portfolio Ops"
            />
          </div>
          <Button onClick={submit} disabled={isPending || !name.trim()}>
            {isPending ? "Adding…" : "Add target"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
