import PocketBase from "pocketbase";

/**
 * Browser/Client-side PocketBase client
 * Use this in Client Components
 * Connects through Next.js rewrite proxy (/api/pocketbase)
 */
export const pbBrowser = new PocketBase(
  typeof window !== "undefined"
    ? `${window.location.origin}/api/pocketbase`
    : "http://127.0.0.1:8080"
);

export type PocketBaseBrowserClient = typeof pbBrowser;
