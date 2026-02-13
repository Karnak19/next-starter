"use client";

import { pbBrowser } from "@/shared/db/browser";

/**
 * Auth helpers using browser PocketBase client
 * Uses /api/pocketbase proxy for client-side auth
 */
export const authClient = pbBrowser;

/**
 * Sync PocketBase auth state to a cookie for server-side access
 * Call this after successful authentication
 */
export const syncAuthCookie = () => {
  const cookie = pbBrowser.authStore.exportToCookie({
    httpOnly: false, // Must be false to set from client
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
  // biome-ignore lint/suspicious/noDocumentCookie: Required for server-side auth sync
  document.cookie = cookie;
};

/**
 * Clear the auth cookie (for sign out)
 */
export const clearAuthCookie = () => {
  // biome-ignore lint/suspicious/noDocumentCookie: Required for server-side auth sync
  document.cookie = "pb_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
};

export const signIn = async (email: string, password: string) => {
  const result = await pbBrowser
    .collection("users")
    .authWithPassword(email, password);
  return result;
};

export const signUp = (email: string, password: string, name: string) => {
  return pbBrowser.collection("users").create({
    email,
    password,
    passwordConfirm: password,
    name,
  });
};

export const signOut = () => {
  pbBrowser.authStore.clear();
  clearAuthCookie();
};

export const useSession = () => pbBrowser.authStore;
