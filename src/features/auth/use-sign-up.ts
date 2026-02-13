"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { signIn, signUp, syncAuthCookie } from "@/shared/auth/client";
import type { SignUpFormData } from "./schemas";

/**
 * Custom hook for sign-up functionality
 * Wraps PocketBase signUp with React state management
 */
export function useSignUp() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const signUpAction = async (data: SignUpFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      await signUp(data.email, data.password, data.name);
      // Auto sign-in after successful registration
      await signIn(data.email, data.password);
      // Sync auth state to cookie for server-side access
      syncAuthCookie();
      router.push("/");
      router.refresh();
      return { data: true };
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
    signUp: signUpAction,
    isLoading,
    error,
  };
}
