import { client } from "./generated/client.gen";

/**
 * Browser/Client-side PocketBase client — the pbkit-generated singleton
 * (src/shared/db/generated/client.gen.ts, written by `bun run typegen`).
 * Use this in Client Components.
 *
 * Its baseUrl is the RELATIVE "/api/pocketbase": in the browser the PocketBase
 * SDK resolves it against the page origin, so it connects through the Next.js
 * rewrite proxy (/api/pocketbase, see next.config.ts) exactly like before —
 * but with no window access at module scope, so importing it in a server
 * bundle is harmless (it is never used there: server code always passes its
 * own client, see server.ts).
 *
 * Because this IS the instance the generated SDK functions (sdk.gen.ts,
 * tanstack.gen.ts) default to, client-side generated queries/mutations share
 * this authStore: signing in through pbBrowser authenticates them too.
 */
export const pbBrowser = client;

export type PocketBaseBrowserClient = typeof pbBrowser;
