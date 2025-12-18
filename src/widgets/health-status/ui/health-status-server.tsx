import { api } from "@/shared/api/eden.server";

/**
 * Server Component version of HealthStatus
 * Uses server Eden client for direct function calls (no HTTP overhead)
 */
export async function HealthStatusServer() {
  "use cache";

  const { data, error } = await api.health.get();

  if (error) {
    return (
      <div className="flex items-center gap-2 text-red-500 text-sm">
        <span className="h-2 w-2 rounded-full bg-red-500" />
        Server Error
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
      <span className="h-2 w-2 rounded-full bg-green-500" />
      SSR: {data?.status}
    </div>
  );
}
