"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  BookOpen,
  MessagesSquare,
  Building2,
  Layers,
  UserRound,
  Quote,
  Menu,
  X,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const NAV: NavItem[] = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/stories", label: "Stories", icon: BookOpen },
  { href: "/questions", label: "Questions", icon: MessagesSquare },
  { href: "/targets", label: "Targets", icon: Building2 },
  { href: "/practice", label: "Practice", icon: Layers },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

function Wordmark() {
  return (
    <Link href="/" className="flex items-center gap-2.5 px-1">
      <span className="grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground">
        <Quote className="h-4 w-4" />
      </span>
      <span className="font-mono text-sm font-semibold tracking-[0.18em] text-foreground">
        STORY BANK
      </span>
    </Link>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // The practice session gets a focused treatment on mobile: hide the bottom
  // tab bar so the rating buttons are reachable.
  const isFocusRoute = pathname.startsWith("/practice/session");

  return (
    <div className="min-h-screen md:pl-60">
      {/* Desktop left rail */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-border bg-sidebar/70 backdrop-blur md:flex">
        <div className="px-4 py-5">
          <Wordmark />
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {NAV.map((item) => (
            <RailLink
              key={item.href}
              item={item}
              active={isActive(pathname, item.href)}
            />
          ))}
        </nav>
        <div className="space-y-1 px-3 pb-2">
          <RailLink
            item={{ href: "/account", label: "Account", icon: UserRound }}
            active={isActive(pathname, "/account")}
          />
        </div>
        <div className="flex items-center justify-between border-t border-border px-4 py-3">
          <span className="text-xs text-muted-foreground">Interview prep</span>
          <ThemeToggle />
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-background/80 px-4 py-3 backdrop-blur md:hidden">
        <Wordmark />
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <button
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
            className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground transition hover:bg-secondary hover:text-foreground"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* Mobile full-nav overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-30 md:hidden">
          <div
            className="absolute inset-0 bg-background/60 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />
          <nav className="absolute inset-x-0 top-[57px] max-h-[70vh] overflow-y-auto border-b border-border bg-sidebar p-3 shadow-xl">
            {[...NAV, { href: "/account", label: "Account", icon: UserRound }].map(
              (item) => {
                const active = isActive(pathname, item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                      active
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </Link>
                );
              },
            )}
          </nav>
        </div>
      )}

      {/* Content */}
      <main
        className={`mx-auto w-full max-w-5xl px-4 pt-6 sm:px-6 md:pt-10 ${
          isFocusRoute ? "pb-6 md:pb-12" : "pb-28 md:pb-12"
        }`}
      >
        {children}
      </main>

      {/* Mobile bottom tab bar */}
      <nav
        className={`fixed inset-x-0 bottom-0 z-30 grid-cols-5 border-t border-border bg-sidebar/90 backdrop-blur md:hidden ${
          isFocusRoute ? "hidden" : "grid"
        }`}
      >
        {NAV.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 py-2 text-[10px] ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function RailLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
        active
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {item.label}
    </Link>
  );
}
