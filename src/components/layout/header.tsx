"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { LogOut, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header() {
  const { data: session } = useSession();

  return (
    <header className="flex h-14 shrink-0 items-center border-b border-border bg-background px-4 lg:px-6">
      <Link
        href="/"
        className="flex items-center gap-2 text-lg font-bold tracking-tight"
      >
        <Monitor className="h-5 w-5 text-primary" />
        <span className="text-primary">NuvaiTracker</span>
      </Link>

      <div className="ml-auto flex items-center gap-3">
        {session?.user && (
          <>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              {session.user.name ?? session.user.email}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => signOut({ callbackUrl: "/auth/signin" })}
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
