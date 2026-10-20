import PocketBase from "pocketbase";
import type { PbClient } from "./generated/client.gen";

/**
 * Server-side PocketBase client (singleton)
 * Use this in Server Components and Server Actions
 * Connects directly to PocketBase via internal network
 *
 * Pass this — or a per-request client — to the generated SDK functions
 * (sdk.gen.ts) as the last argument: `getUser(id, undefined, { client: pbServer })`.
 * Never let server code fall back to the generated client.gen.ts singleton:
 * its relative "/api/pocketbase" baseUrl only resolves in the browser.
 *
 * ⚠️ PER-REQUEST CLIENT RULE (auth leak):
 * This singleton is safe for unauthenticated reads only. NEVER save a user
 * token on it (authWithPassword / authStore.save): the module is cached for
 * the whole server process, so one user's token would leak into every
 * concurrent request. For anything acting as the signed-in user, create a
 * PocketBase PER REQUEST, load the auth cookie into it, and pass it through:
 *
 *   const pb = new PocketBase(process.env.POCKETBASE_URL ?? "http://127.0.0.1:8080");
 *   pb.authStore.loadFromCookie(`pb_auth=${(await cookies()).get("pb_auth")?.value ?? ""}`);
 *   const user = await getUser(pb.authStore.record.id, undefined, { client: pb });
 *
 * See src/widgets/user-info/user-info-server.tsx for the existing pattern.
 * pbAdmin (admin.ts) is the one safe singleton: it authenticates as a
 * superuser, not as a user.
 */
export const pbServer: PbClient = new PocketBase(
  process.env.POCKETBASE_URL ?? "http://127.0.0.1:8080"
);

export type PocketBaseServerClient = typeof pbServer;
