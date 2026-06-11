"use server";

import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db, schema } from "@/lib/db/client";
import { createSession, deleteSession, getSession } from "@/lib/auth";

export type AuthState = { error: string } | null;

export async function registerAction(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = ((formData.get("email") as string) ?? "").trim().toLowerCase();
  const password = (formData.get("password") as string) ?? "";

  if (!email || !password) return { error: "Email and password are required" };
  if (password.length < 8)
    return { error: "Password must be at least 8 characters" };

  const existing = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .limit(1);
  if (existing.length > 0)
    return { error: "An account with that email already exists" };

  const passwordHash = await bcrypt.hash(password, 12);
  const id = nanoid();
  await db
    .insert(schema.users)
    .values({ id, email, passwordHash, createdAt: Date.now() });
  await createSession({ userId: id, email });
  redirect("/");
}

export async function loginAction(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = ((formData.get("email") as string) ?? "").trim().toLowerCase();
  const password = (formData.get("password") as string) ?? "";

  if (!email || !password) return { error: "Email and password are required" };

  const rows = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .limit(1);
  if (rows.length === 0) return { error: "Invalid email or password" };

  const user = rows[0];
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return { error: "Invalid email or password" };

  await createSession({ userId: user.id, email: user.email });
  redirect("/");
}

export async function logoutAction(): Promise<void> {
  await deleteSession();
  redirect("/login");
}

export type ChangePasswordState =
  | { ok: true; message: string }
  | { error: string }
  | null;

export async function changePasswordAction(
  _prevState: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  const session = await getSession();
  if (!session) return { error: "Not authenticated" };

  const current = (formData.get("current") as string) ?? "";
  const next = (formData.get("new") as string) ?? "";
  const confirm = (formData.get("confirm") as string) ?? "";

  if (!current || !next || !confirm) return { error: "All fields are required" };
  if (next.length < 8) return { error: "New password must be at least 8 characters" };
  if (next !== confirm) return { error: "New passwords do not match" };

  const rows = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, session.userId))
    .limit(1);
  if (rows.length === 0) return { error: "Account not found" };

  const valid = await bcrypt.compare(current, rows[0].passwordHash);
  if (!valid) return { error: "Current password is incorrect" };

  const passwordHash = await bcrypt.hash(next, 12);
  await db
    .update(schema.users)
    .set({ passwordHash })
    .where(eq(schema.users.id, session.userId));

  return { ok: true, message: "Password updated successfully" };
}
