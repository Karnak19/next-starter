import { headers } from "next/headers";
import Link from "next/link";
import { api } from "@/shared/api/eden.server";
import { Button } from "@/shared/ui";

/**
 * Server Component that fetches user data via Eden
 * Uses "use cache" for cache components + streaming with Suspense
 */
async function UserInfoContent() {
  // Simulate slight delay to show streaming
  await new Promise((resolve) => setTimeout(resolve, 500));

  const h = await headers();

  const { data, error } = await api.me.get({
    headers: Object.fromEntries(h.entries()),
  });

  if (error || !data?.user) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Not signed in
        </p>
        <div className="flex gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href="/auth/sign-in">Sign in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/auth/sign-up">Sign up</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-200 font-medium text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200">
          {data.user.name?.charAt(0).toUpperCase() ?? "?"}
        </div>
        <div>
          <p className="font-medium text-zinc-900 dark:text-zinc-100">
            {data.user.name}
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {data.user.email}
          </p>
        </div>
      </div>
      <p className="text-xs text-zinc-400 dark:text-zinc-500">
        Rendered on server via Eden + "use cache"
      </p>
    </div>
  );
}

function UserInfoSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-700" />
        <div className="flex flex-col gap-2">
          <div className="h-4 w-24 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
          <div className="h-3 w-32 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
        </div>
      </div>
      <div className="h-3 w-48 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
    </div>
  );
}

export { UserInfoContent, UserInfoSkeleton };
