import "server-only";

import PocketBase from "pocketbase";
import type { PbClient } from "./generated/client.gen";

/**
 * Admin/Superuser PocketBase client (singleton)
 * ⚠️ SERVER ONLY - Never import this in client components
 *
 * This client is safe to use as a global singleton because it authenticates
 * as a superuser and does NOT track regular user auth state (see the
 * per-request client rule in server.ts — pbAdmin is the one allowed
 * singleton).
 *
 * Use this for server-side operations that need admin privileges:
 * - Server Actions that create/update/delete records
 * - Webhook handlers
 * - Background jobs
 * - Any operation requiring superuser access
 *
 * Pass it to the generated SDK functions (sdk.gen.ts) as
 * `{ client: pbAdmin }` — e.g. `listUsers({ page: 1 }, { client: pbAdmin })`.
 *
 * As recommended by PocketBase maintainer:
 * "You could create one-off node server-side actions that will interact
 * with PocketBase only as admin/superuser and as pure data store"
 * @see https://github.com/pocketbase/pocketbase/discussions/5313
 *
 * Requires POCKETBASE_ADMIN_TOKEN env var
 * Get token from: pocketbase superusers create <email> <password>
 * Then: pocketbase superusers list
 */
export const pbAdmin: PbClient = new PocketBase(
  process.env.POCKETBASE_URL ?? "http://127.0.0.1:8080"
);

// Disable auto-cancellation to handle concurrent requests from multiple users
pbAdmin.autoCancellation(false);

// Authenticate as superuser if token is available
if (process.env.POCKETBASE_ADMIN_TOKEN) {
  pbAdmin.authStore.save(process.env.POCKETBASE_ADMIN_TOKEN, null);
}

export type PocketBaseAdminClient = typeof pbAdmin;
