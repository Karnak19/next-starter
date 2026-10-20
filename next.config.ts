import type { NextConfig } from "next";

const POCKETBASE_URL = process.env.POCKETBASE_URL ?? "http://127.0.0.1:8080";

/**
 * Explicit allowlist of the PocketBase routes proxied through `/api/pocketbase/*`.
 *
 * This is deliberately an ALLOWLIST (fail-closed): anything NOT listed here is
 * not matched by any rewrite, falls through to the Next.js router and 404s.
 * The previous catch-all `/:path*` rewrite also forwarded the PocketBase admin
 * UI (`/_/`), the superuser login (`/api/collections/_superusers/*`) and the
 * superuser-only endpoints (`/api/backups`, `/api/settings`, `/api/logs`,
 * `/api/crons`), exposing them on the public app domain. A deny-list would
 * keep them one forgotten entry away from being exposed again.
 *
 * The superuser reaches the admin UI through a private route (SSH tunnel or
 * internal network), never through the app domain. See README.
 *
 * Adding a new PocketBase collection? Add its routes here too, or the browser
 * client will get 404s.
 */
const POCKETBASE_PROXY_ROUTES: ReadonlyArray<{ from: string; to: string }> = [
  // Liveness probe
  { from: "/api/health", to: "/api/health" },
  // OAuth2 callback target used by PocketBase OAuth2 sign-in
  { from: "/api/oauth2-redirect", to: "/api/oauth2-redirect" },
  // "users" auth endpoints.
  // NOTE: exact routes MUST come before their `/:path*` counterpart — `:path*`
  // matches an empty segment, which would produce a destination with a
  // trailing slash, and PocketBase 404s on trailing slashes.
  {
    from: "/api/collections/users/auth-methods",
    to: "/api/collections/users/auth-methods",
  },
  {
    from: "/api/collections/users/auth-with-password",
    to: "/api/collections/users/auth-with-password",
  },
  {
    from: "/api/collections/users/auth-refresh",
    to: "/api/collections/users/auth-refresh",
  },
  {
    from: "/api/collections/users/auth-with-oauth2",
    to: "/api/collections/users/auth-with-oauth2",
  },
  {
    from: "/api/collections/users/request-password-reset",
    to: "/api/collections/users/request-password-reset",
  },
  {
    from: "/api/collections/users/request-verification",
    to: "/api/collections/users/request-verification",
  },
  {
    from: "/api/collections/users/confirm-verification",
    to: "/api/collections/users/confirm-verification",
  },
  // "users" records — exact route BEFORE the parametrized one (see note above)
  {
    from: "/api/collections/users/records",
    to: "/api/collections/users/records",
  },
  {
    from: "/api/collections/users/records/:path*",
    to: "/api/collections/users/records/:path*",
  },
  // File access (pb.files.getURL)
  { from: "/api/files/:path*", to: "/api/files/:path*" },
];

const nextConfig: NextConfig = {
  reactCompiler: true,
  cacheComponents: true,
  output: "standalone",
  // Next's trailing-slash normalization (308 `/foo/` -> `/foo`) runs BEFORE
  // rewrites, so the PocketBase admin UI path `/api/pocketbase/_/` answered
  // with a 308 redirect to the 404 instead of the 404 itself. Skipping the
  // redirect makes every non-allowlisted path answer 404 directly.
  // Routes still resolve with or without a trailing slash (`/auth/sign-in` and
  // `/auth/sign-in/` both serve 200) — only the canonical redirect is gone.
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return {
      // `beforeFiles`: rewrites are applied BEFORE filesystem route matching,
      // so a catch-all `/api/[[...slugs]]` route cannot swallow
      // `/api/pocketbase/*` before the rewrite runs.
      beforeFiles: POCKETBASE_PROXY_ROUTES.map(({ from, to }) => ({
        source: `/api/pocketbase${from}`,
        destination: `${POCKETBASE_URL}${to}`,
      })),
    };
  },
};

export default nextConfig;
