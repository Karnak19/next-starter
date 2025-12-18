/**
 * Auth - Public API
 *
 * Server-side: import { auth } from "@/shared/auth"
 * Client-side: import { signIn, signOut, useSession } from "@/shared/auth/client"
 */

export type { Session } from "./server";
export { auth } from "./server";
