"use client";

import type { RecordModel } from "pocketbase";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";
import { pbBrowser } from "@/shared/db/browser";

type AuthContextValue = {
  user: RecordModel | null;
  isAuthenticated: boolean;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

// Cache for stable snapshot references to avoid infinite loops
let cachedUser: RecordModel | null = null;
let cachedUserId: string | undefined;

function getUserSnapshot(): RecordModel | null {
  const currentRecord = pbBrowser.authStore.record;
  const currentId = currentRecord?.id;
  // Only update cache if the record id changed
  if (currentId !== cachedUserId) {
    cachedUser = currentRecord;
    cachedUserId = currentId;
  }
  return cachedUser;
}

function getIsValidSnapshot(): boolean {
  return pbBrowser.authStore.isValid;
}

function getServerUserSnapshot(): RecordModel | null {
  return null;
}

function getServerIsValidSnapshot(): boolean {
  return false;
}

/**
 * Auth Provider that subscribes to PocketBase auth store changes
 * Provides reactive auth state throughout the app
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  // Track hydration state - true until client has mounted
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Once mounted on client, we have access to localStorage/authStore
    setIsLoading(false);
  }, []);

  const subscribe = useCallback((callback: () => void) => {
    return pbBrowser.authStore.onChange(callback);
  }, []);

  // Subscribe to PocketBase auth store changes using useSyncExternalStore
  // This ensures components re-render when auth state changes
  const isAuthenticated = useSyncExternalStore(
    subscribe,
    getIsValidSnapshot,
    getServerIsValidSnapshot
  );

  const user = useSyncExternalStore(
    subscribe,
    getUserSnapshot,
    getServerUserSnapshot
  );

  const value: AuthContextValue = {
    user,
    isAuthenticated,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access auth state
 * Must be used within AuthProvider
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
