"use client";

import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "@/shared/auth/client";
import { useAuth } from "@/shared/providers/auth-provider";
import { Button } from "@/shared/ui/button";

export function UserMenu() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, isLoading } = useAuth();

  // Show skeleton while hydrating to avoid UI flicker
  if (isLoading) {
    return (
      <div className="flex gap-2">
        <div className="h-8 w-16 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-8 w-16 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
      </div>
    );
  }

  if (!(isAuthenticated && user)) {
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

  const handleSignOut = () => {
    signOut();
    queryClient.invalidateQueries({ queryKey: ["me"] });
    router.refresh();
  };

  return (
    <div className="flex items-center gap-3">
      <div className="text-right">
        <p className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
          {user.name as string}
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {user.email as string}
        </p>
      </div>
      <Button onClick={handleSignOut} size="sm" variant="outline">
        Sign out
      </Button>
    </div>
  );
}
