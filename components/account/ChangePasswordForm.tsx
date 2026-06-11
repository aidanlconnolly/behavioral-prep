"use client";

import { useActionState } from "react";
import { changePasswordAction } from "@/lib/actions/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function ChangePasswordForm() {
  const [state, action, isPending] = useActionState(changePasswordAction, null);

  return (
    <form action={action} className="max-w-sm space-y-4">
      <Input
        name="current"
        type="password"
        required
        placeholder="Current password"
        autoComplete="current-password"
      />
      <Input
        name="new"
        type="password"
        required
        minLength={8}
        placeholder="New password (min 8 chars)"
        autoComplete="new-password"
      />
      <Input
        name="confirm"
        type="password"
        required
        minLength={8}
        placeholder="Confirm new password"
        autoComplete="new-password"
      />
      {state && "error" in state && (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}
      {state && "ok" in state && (
        <p className="rounded-lg border border-success/40 bg-success/10 px-3 py-2 text-sm text-success">
          {state.message}
        </p>
      )}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Updating…" : "Update password"}
      </Button>
    </form>
  );
}
