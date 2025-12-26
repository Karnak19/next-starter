"use client";

import { api } from "@/shared/api";
import { useApiQuery } from "@/shared/api/use-api";

export function HealthStatus() {
  const { data, isLoading, error } = useApiQuery(["health"], api.health.get);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-zinc-500">
        <span className="h-2 w-2 animate-pulse rounded-full bg-zinc-400" />
        Checking...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-red-500 text-sm">
        <span className="h-2 w-2 rounded-full bg-red-500" />
        Error
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
      <span className="h-2 w-2 rounded-full bg-green-500" />
      API: {data?.status}
    </div>
  );
}
