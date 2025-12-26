"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { signIn } from "@/shared/auth/client";
import type { SignInFormData } from "../model/schemas";

/**
 * Custom hook for sign-in functionality
 * Wraps Better Auth's signIn with React state management
 *
 * @example
 * ```tsx
 * function SignInForm() {
 *   const { signIn, isLoading, error } = useSignIn();
 *
 *   return (
 *     <form onSubmit={(e) => {
 *       e.preventDefault();
 *       signIn({ email, password });
 *     }}>
 *       {error && <div>{error}</div>}
 *       <button disabled={isLoading}>Sign in</button>
 *     </form>
 *   );
 * }
 * ```
 */
export function useSignIn() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const signInAction = async (data: SignInFormData) => {
    setIsLoading(true);
    setError(null);

    const result = await signIn.email({
      email: data.email,
      password: data.password,
    });

    if (result.error) {
      setError(result.error.message ?? "Something went wrong");
      setIsLoading(false);
      return { error: result.error };
    }

    router.push("/");
    router.refresh();
    setIsLoading(false);
    return { data: result.data };
  };

  return {
    signIn: signInAction,
    isLoading,
    error,
  };
}
