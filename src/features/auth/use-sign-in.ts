"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { signIn, syncAuthCookie } from "@/shared/auth/client";
import type { SignInFormData } from "./schemas";

/**
 * Custom hook for sign-in functionality
 * Wraps PocketBase signIn with React state management
 */
export function useSignIn() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const signInAction = async (data: SignInFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn(data.email, data.password);
      // Sync auth state to cookie for server-side access
      syncAuthCookie();
      router.push("/");
      router.refresh();
      return { data: result };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      return { error: err };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    signIn: signInAction,
    isLoading,
    error,
  };
}
