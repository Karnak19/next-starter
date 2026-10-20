"use client";

import { useQuery } from "@tanstack/react-query";
import { userOptions } from "../generated/tanstack.gen";

/**
 * Example: a TanStack Query built from the pbkit-generated options
 * (src/shared/db/generated/tanstack.gen.ts, written by `bun run typegen`).
 *
 * Browser: no `{ client }` needed — the generated options default to the
 * generated client.gen.ts singleton, whose relative "/api/pocketbase"
 * baseUrl goes through the same proxy as pbBrowser (and shares its
 * authStore, so generated queries run authenticated after sign-in).
 *
 * Server: NEVER rely on the generated singleton. Its relative baseUrl does
 * not resolve without a window, and a shared client that saves a user token
 * leaks one user's identity into concurrent requests (see the per-request
 * client rule in src/shared/db/server.ts). Pass a per-request client
 * through the options instead:
 *
 *   const pb = new PocketBase(process.env.POCKETBASE_URL ?? "http://127.0.0.1:8080");
 *   pb.authStore.loadFromCookie(`pb_auth=${(await cookies()).get("pb_auth")?.value ?? ""}`);
 *   await queryClient.prefetchQuery(userOptions(id, undefined, { client: pb }));
 *
 * Mutations follow the same shape: `useMutation(createUserMutationOptions())`
 * client-side, `createUser(draft, { client: pbAdmin })` server-side.
 */
export function useUser(id: string | undefined) {
  return useQuery({
    ...userOptions(id ?? ""),
    enabled: id != null,
  });
}
