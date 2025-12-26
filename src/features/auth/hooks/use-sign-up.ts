"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { signUp } from "@/shared/auth/client";
import type { SignUpFormData } from "../model/schemas";

/**
 * Custom hook for sign-up functionality
 * Wraps Better Auth's signUp with React state management
 *
 * @example
 * ```tsx
 * function SignUpForm() {
 *   const { signUp, isLoading, error } = useSignUp();
 *
 *   return (
 *     <form onSubmit={(e) => {
 *       e.preventDefault();
 *       signUp({ name, email, password });
 *     }}>
 *       {error && <div>{error}</div>}
 *       <button disabled={isLoading}>Create account</button>
 *     </form>
 *   );
 * }
 * ```
 */
export function useSignUp() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const signUpAction = async (data: SignUpFormData) => {
    setIsLoading(true);
    setError(null);

    const result = await signUp.email({
      name: data.name,
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
    signUp: signUpAction,
    isLoading,
    error,
  };
}
