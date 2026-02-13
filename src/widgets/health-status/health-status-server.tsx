import { pbServer } from "@/shared/db/server";

/**
 * Server Component version of HealthStatus
 * Checks PocketBase health endpoint
 */
export async function HealthStatusServer() {
  "use cache";

  try {
    const health = await pbServer.health.check();

    return (
      <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
        <span className="h-2 w-2 rounded-full bg-green-500" />
        SSR: {health.code === 200 ? "ok" : "error"}
      </div>
    );
  } catch {
    return (
      <div className="flex items-center gap-2 text-red-500 text-sm">
        <span className="h-2 w-2 rounded-full bg-red-500" />
        Server Error
      </div>
    );
  }
}
