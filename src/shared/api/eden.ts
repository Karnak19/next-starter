import { treaty } from "@elysiajs/eden";
import type { app } from "~/app/api/[[...slugs]]/route";

/**
 * Type-safe API client using Eden Treaty (Client-side)
 * Uses type-only import to avoid pulling server code to client bundle
 */
export const api = treaty<typeof app>(
  typeof window === "undefined"
    ? "http://localhost:3000"
    : window.location.origin
).api;

export type App = typeof app;
export type Api = typeof api;
