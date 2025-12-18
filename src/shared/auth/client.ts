"use client";

import { createAuthClient } from "better-auth/react";

/**
 * Better Auth client for React
 */
export const authClient = createAuthClient();

export const { signIn, signOut, signUp, useSession } = authClient;
