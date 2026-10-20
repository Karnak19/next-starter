import type { PbkitConfig } from "@karnak19/pbkit";
import { tanstack } from "@karnak19/pbkit-tanstack";
import { zodPlugin } from "@karnak19/pbkit-zod";

/**
 * pbkit codegen config — `bun run typegen` (runs `pbkit generate`).
 *
 * Rerun after EVERY PocketBase schema change (collection create/update,
 * field added/renamed, rule or constraint change). The output under
 * src/shared/db/generated/ is committed, so the build works without a
 * running PocketBase.
 *
 * Generation needs superuser access to read the schema. Credentials come
 * from .env.local (gitignored) — nothing is hardcoded here:
 *   PB_TYPEGEN_URL               PocketBase URL (falls back to POCKETBASE_URL)
 *   PB_TYPEGEN_TOKEN             existing superuser token (falls back to
 *                                POCKETBASE_ADMIN_TOKEN), OR:
 *   PB_TYPEGEN_EMAIL + PB_TYPEGEN_PASSWORD
 *                                superuser email/password — a short-lived
 *                                token is minted for the fetch, same auth
 *                                flow as `pbkit schema` subcommands.
 */

const url = (
  process.env.PB_TYPEGEN_URL ??
  process.env.POCKETBASE_URL ??
  ""
).replace(/\/+$/, "");

async function resolveSuperuserToken(): Promise<string | undefined> {
  const token =
    process.env.PB_TYPEGEN_TOKEN ?? process.env.POCKETBASE_ADMIN_TOKEN;
  if (token) {
    return token;
  }

  const email = process.env.PB_TYPEGEN_EMAIL;
  const password = process.env.PB_TYPEGEN_PASSWORD;
  if (!(url && email && password)) {
    return undefined;
  }

  const res = await fetch(
    `${url}/api/collections/_superusers/auth-with-password`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identity: email, password }),
    }
  );
  if (!res.ok) {
    throw new Error(
      `pbkit: superuser auth failed (${res.status}). Check PB_TYPEGEN_EMAIL / PB_TYPEGEN_PASSWORD.`
    );
  }
  const data = (await res.json()) as { token?: string };
  return data.token;
}

const token = await resolveSuperuserToken();

if (!url) {
  throw new Error(
    "pbkit: set PB_TYPEGEN_URL (or POCKETBASE_URL) in .env.local"
  );
}
if (!token) {
  throw new Error(
    "pbkit: set PB_TYPEGEN_TOKEN, or PB_TYPEGEN_EMAIL + PB_TYPEGEN_PASSWORD, in .env.local"
  );
}

export default {
  input: { url, token },
  output: "./src/shared/db/generated",
  types: {
    dateStrings: true,
    nullableFields: false,
    optionalFields: "required-only",
    expandDepth: 2,
  },
  sdk: {
    enabled: true,
    pbImport: "pocketbase",
    // Deliberately browser-oriented: a RELATIVE url, so the generated
    // client.gen.ts singleton talks to the same origin through the
    // /api/pocketbase rewrite proxy (next.config.ts) — same as pbBrowser.
    // The server CANNOT use one baseUrl for both sides: the browser must go
    // through the proxy, the server must hit POCKETBASE_URL directly. Server
    // code therefore always passes its own client to the generated SDK
    // (`{ client: pb }`, see src/shared/db/server.ts).
    baseUrl: "/api/pocketbase",
    typesImport: "./types.gen",
  },
  // System collections (_superusers, _authOrigins, ...) are excluded by default.
  includeSystem: false,
  plugins: [zodPlugin, tanstack({ framework: "react" })],
} satisfies PbkitConfig;
