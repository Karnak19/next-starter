"use client";

import Link from "next/link";
import { api } from "@/shared/api";
import { useApi, useApiQuery } from "@/shared/api/use-api";
import { signOut } from "@/shared/auth/client";
import { Button } from "@/shared/ui";

export function UserMenu() {
  const { data, isLoading } = useApiQuery(["me"], api.me.get);
  const { invalidate } = useApi();

  if (isLoading) {
    return (
      <div className="h-9 w-20 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
    );
  }

  if (!data?.user) {
    return (
      <div className="flex gap-2">
        <Button asChild size="sm" variant="ghost">
          <Link href="/auth/sign-in">Sign in</Link>
        </Button>
        <Button asChild size="sm">
          <Link href="/auth/sign-up">Sign up</Link>
        </Button>
      </div>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    invalidate(["me"]);
  };

  return (
    <div className="flex items-center gap-3">
      <div className="text-right">
        <p className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
          {data.user.name}
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {data.user.email}
        </p>
      </div>
      <Button onClick={handleSignOut} size="sm" variant="outline">
        Sign out
      </Button>
    </div>
  );
}
