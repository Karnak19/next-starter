import "server-only";

import { treaty } from "@elysiajs/eden";
import { app } from "~/app/api/[[...slugs]]/route";

/**
 * Type-safe API client using Eden Treaty (Server-side)
 * Imports the actual app instance for direct function calls (no HTTP)
 */
export const api = treaty(app).api;

export type Api = typeof api;
