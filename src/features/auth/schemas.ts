import { z } from "zod";
import { UsersCreateSchema } from "@/shared/db/generated/zod.gen";

/**
 * Auth form schemas, derived from the pbkit-generated Zod schemas
 * (src/shared/db/generated/zod.gen.ts) so the PocketBase field constraints
 * (required, min/max, formats) have a single source of truth: rerun
 * `bun run typegen` after any PocketBase migration to pick them up.
 *
 * Hand-written here is ONLY what PocketBase cannot express:
 * - `confirmPassword` + the "Passwords don't match" refine — passwordConfirm
 *   is a create-request protocol field, not a schema field;
 * - `name` required with a 2-char minimum — PocketBase's `name` is optional
 *   with min 0, so that is a form rule.
 *
 * User-facing messages cannot live in the generated schema (PocketBase has no
 * UI copy), so they are attached at parse time instead: `authFormMessages`
 * is passed to `zodResolver` as the zod 4 parse `error` callback. It only
 * fills in issues that have no message of their own, so checks that carry
 * their own message (`name`, the refine) are untouched.
 */
const authFormMessages = (issue: z.core.$ZodRawIssue): string | undefined => {
  const field = issue.path?.[0];
  if (field === "email") {
    return "Please enter a valid email";
  }
  if (field === "password") {
    return "Password must be at least 8 characters";
  }
};

export const signInSchema = UsersCreateSchema.pick({
  email: true,
  password: true,
});

export const signUpSchema = UsersCreateSchema.pick({
  email: true,
  password: true,
})
  .extend({
    // Form-only rules (PocketBase's `name` is optional with min 0)
    name: z.string().min(2, "Name must be at least 2 characters"),
    // Not a schema field — see file comment
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export { authFormMessages };

export type SignInFormData = z.infer<typeof signInSchema>;
export type SignUpFormData = z.infer<typeof signUpSchema>;
