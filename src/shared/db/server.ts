import PocketBase from "pocketbase";

/**
 * Server-side PocketBase client
 * Use this in Server Components and Server Actions
 * Connects directly to PocketBase via internal network
 */
export const pbServer = new PocketBase(
  process.env.POCKETBASE_URL ?? "http://127.0.0.1:8080"
);

export type PocketBaseServerClient = typeof pbServer;
