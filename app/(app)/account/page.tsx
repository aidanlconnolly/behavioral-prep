import { getSession } from "@/lib/auth";
import { logoutAction } from "@/lib/actions/auth";
import { ChangePasswordForm } from "@/components/account/ChangePasswordForm";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await getSession();

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-1 font-heading text-2xl font-bold tracking-tight">
        Account
      </h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Signed in as <span className="text-foreground">{session?.email}</span>
      </p>

      <section className="mb-10">
        <h2 className="mb-4 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
          Change password
        </h2>
        <ChangePasswordForm />
      </section>

      <form action={logoutAction}>
        <Button type="submit" variant="outline">
          <LogOut data-icon="inline-start" />
          Sign out
        </Button>
      </form>
    </div>
  );
}
