"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { Header } from "@/components/layout/header";
import { TrackerNav, type TrackerType } from "@/components/layout/tracker-nav";

const PUBLIC_PATHS = ["/auth/signin", "/api/"];

const TASK_PATHS = ["/status", "/modules", "/tasks", "/dashboard"];
const ACCOUNT_PATHS = ["/accounts", "/cards", "/payments", "/audit-logs"];
const LAPTOP_PATHS = ["/laptops"];

function getTracker(pathname: string): TrackerType | null {
  if (TASK_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/")))
    return "task";
  if (ACCOUNT_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/")))
    return "account";
  if (LAPTOP_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/")))
    return "laptop";
  return null;
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  useEffect(() => {
    if (status === "unauthenticated" && !isPublic) {
      router.replace("/auth/signin");
    }
  }, [status, isPublic, router]);

  if (isPublic) return <>{children}</>;

  if (status === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  const tracker = getTracker(pathname);

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Header />
      {tracker && <TrackerNav tracker={tracker} />}
      <main className="flex-1 overflow-y-auto p-4 lg:p-6">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
