"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, Save, Trash2 } from "lucide-react";
import { deleteTarget, updateTarget, type TargetDetail } from "@/lib/actions/targets";
import { saveAnswer } from "@/lib/actions/answers";
import type { Category } from "@/lib/db/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AddQuestionDialog } from "@/components/questions/AddQuestionDialog";

export function TargetDetailView({
  detail,
  categories,
}: {
  detail: TargetDetail;
  categories: Category[];
}) {
  const { target, variantQuestions, templateQuestions, pitch } = detail;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(target.name);
  const [role, setRole] = useState(target.role);
  const [whyThem, setWhyThem] = useState(target.whyThem);
  const [notes, setNotes] = useState(target.notes);
  const [pitchBody, setPitchBody] = useState(pitch?.body ?? "");

  const templateSlug =
    target.kind === "company" ? "why_company" : "why_industry";

  function save() {
    startTransition(async () => {
      await updateTarget(target.id, { name, role, whyThem, notes });
      toast.success("Target saved");
      router.refresh();
    });
  }

  function savePitch() {
    startTransition(async () => {
      await saveAnswer({
        targetId: target.id,
        kind: "pitch",
        body: pitchBody,
      });
      toast.success("Pitch saved");
      router.refresh();
    });
  }

  function confirmDelete() {
    if (
      !window.confirm(
        `Delete ${target.name}? Its question variants and answers go with it.`,
      )
    )
      return;
    startTransition(async () => {
      await deleteTarget(target.id);
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/targets"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" /> Targets
        </Link>
        <Button onClick={save} disabled={isPending}>
          <Save data-icon="inline-start" />
          {isPending ? "Saving…" : "Save"}
        </Button>
      </div>

      <div className="space-y-2">
        <Badge variant="secondary" className="capitalize">
          {target.kind}
        </Badge>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-10 text-lg font-medium"
        />
        <Input
          value={role}
          onChange={(e) => setRole(e.target.value)}
          placeholder="Role / track you're targeting"
        />
      </div>

      <div className="space-y-1.5">
        <Label>
          Why {target.kind === "company" ? "them" : "this industry"} — your core
          thesis
        </Label>
        <Textarea
          value={whyThem}
          onChange={(e) => setWhyThem(e.target.value)}
          placeholder="The 2-3 honest reasons, in one tight paragraph."
          rows={3}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Research notes</Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Deals, people you've met, recent news, comp structure, culture notes…"
          rows={5}
        />
      </div>

      {/* The pitch */}
      <Card size="sm">
        <CardHeader>
          <CardTitle className="text-sm">
            Your 60-second pitch for {target.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Textarea
            value={pitchBody}
            onChange={(e) => setPitchBody(e.target.value)}
            placeholder="What you'd say when they ask “so, why us?” — written out, ready to memorize."
            rows={4}
          />
          <Button
            size="sm"
            onClick={savePitch}
            disabled={isPending || pitchBody === (pitch?.body ?? "")}
          >
            <Save data-icon="inline-start" /> Save pitch
          </Button>
        </CardContent>
      </Card>

      {/* Template questions answered for this target */}
      <Card size="sm">
        <CardHeader>
          <CardTitle className="text-sm">
            Standard “{target.kind === "company" ? "why company" : "why industry"}”
            questions — answered for {target.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {templateQuestions.map((q) => (
            <TemplateAnswerEditor
              key={q.id}
              questionId={q.id}
              targetId={target.id}
              questionText={q.text}
              initialBody={q.answer?.body ?? ""}
            />
          ))}
        </CardContent>
      </Card>

      {/* Target-specific question variants */}
      <Card size="sm">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-sm">
            <span>
              Questions specific to {target.name}{" "}
              <Badge variant="secondary" className="ml-1 tnum">
                {variantQuestions.length}
              </Badge>
            </span>
            <AddQuestionDialog
              categories={categories}
              targetId={target.id}
              defaultCategorySlug={templateSlug}
              triggerLabel="Add"
            />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5">
          {variantQuestions.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Add questions you&apos;ve heard this target actually asks — they
              show up in the question bank too.
            </p>
          ) : (
            variantQuestions.map((q) => (
              <Link
                key={q.id}
                href={`/questions/${q.id}`}
                className="flex items-center gap-2 rounded-lg border border-border px-2.5 py-2 text-sm transition hover:border-primary/40"
              >
                <span className="min-w-0 flex-1">{q.text}</span>
                {q.hasAnswer && (
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" />
                )}
              </Link>
            ))
          )}
        </CardContent>
      </Card>

      <Button
        variant="destructive"
        size="sm"
        onClick={confirmDelete}
        disabled={isPending}
      >
        <Trash2 data-icon="inline-start" /> Delete target
      </Button>
    </div>
  );
}

function TemplateAnswerEditor({
  questionId,
  targetId,
  questionText,
  initialBody,
}: {
  questionId: string;
  targetId: string;
  questionText: string;
  initialBody: string;
}) {
  const router = useRouter();
  const [body, setBody] = useState(initialBody);
  const [isPending, startTransition] = useTransition();

  function persist() {
    startTransition(async () => {
      await saveAnswer({ questionId, targetId, body });
      toast.success("Answer saved");
      router.refresh();
    });
  }

  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium leading-snug">{questionText}</p>
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Your answer for this target…"
        rows={2}
      />
      {body !== initialBody && (
        <Button size="xs" variant="secondary" onClick={persist} disabled={isPending}>
          Save
        </Button>
      )}
    </div>
  );
}
