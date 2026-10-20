# Next.js Modern Starter

A production-ready Next.js starter with Feature-Sliced Design architecture, designed for self-hosting with [Coolify](https://coolify.io/).

## Tech Stack

- **Runtime**: [Bun](https://bun.sh/)
- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, React 19, Turbopack)
- **Backend**: [PocketBase](https://pocketbase.io/) 0.40 (Auth, Database, File Storage)
- **Codegen**: [pbkit](https://github.com/Karnak19/pbkit) (types, typed SDK, Zod schemas, TanStack Query options)
- **Storage**: [Cloudflare R2](https://developers.cloudflare.com/r2/) (S3-compatible object storage)
- **State**: [TanStack Query](https://tanstack.com/query)
- **UI**: [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **Validation**: [Zod](https://zod.dev/) + [React Hook Form](https://react-hook-form.com/)
- **Linting**: [Biome](https://biomejs.dev/)
- **Architecture**: [Feature-Sliced Design](https://feature-sliced.design/)
- **Deployment**: [Coolify](https://coolify.io/) (self-hosted PaaS)

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) installed
- [Docker](https://www.docker.com/) and Docker Compose

> **Do not delete `bunfig.toml`.** It pins Bun's linker to `hoisted`, because
> Turbopack refuses the symlinks Bun's default isolated linker creates in
> `node_modules/.bun`. Without it, `bun run build` fails.

### Setup

1. **Install dependencies**

   ```bash
   bun install
   ```

2. **Start PocketBase**

   ```bash
   docker compose up -d
   ```

   This starts PocketBase on port 8080.

3. **Configure environment variables**

   ```bash
   cp .env.local.example .env.local
   ```

   Update the values as needed. The defaults work for local development.

4. **Start dev server**
   ```bash
   bun dev
   ```

Open [http://localhost:3000](http://localhost:3000) to see the app.

**PocketBase Admin UI**: [http://localhost:8080/\_/](http://localhost:8080/_/)

**Stopping services:**

```bash
docker compose down
```

## Project Structure

```
├── app/                    # Next.js App Router (routing only)
├── pocketbase/             # PocketBase extensions
│   ├── pb_hooks/           # Custom JS hooks and routes
│   └── pb_migrations/      # Database migrations
├── src/                    # Feature-Sliced Design layers
│   ├── features/           # User interactions (auth forms, etc.)
│   ├── widgets/            # Composite UI blocks (user menu, etc.)
│   └── shared/             # Shared utilities and clients
│       ├── auth/           # Auth helpers (client & server)
│       ├── db/             # PocketBase clients (browser, server, admin)
│       ├── providers/      # React providers (auth, theme, query)
│       ├── storage/        # R2 storage client
│       ├── lib/            # Utilities (cn, query client)
│       └── ui/             # shadcn/ui components
└── public/                 # Static assets
```

## Scripts

```bash
bun dev           # Start dev server
bun build         # Build for production
bun start         # Start production server
bun lint          # Run Biome linter
bun format        # Format code with Biome
bun run typegen   # Regenerate PocketBase types/SDK/Zod/TanStack options (pbkit)
```

## Environment Variables

See `.env.local.example` for all variables. Local development defaults:

```env
# PocketBase
POCKETBASE_URL=http://127.0.0.1:8080

# PocketBase codegen (only needed to run `bun run typegen`)
PB_TYPEGEN_URL=http://127.0.0.1:8080
PB_TYPEGEN_EMAIL=admin@example.com
PB_TYPEGEN_PASSWORD=your-superuser-password

# R2 Storage (optional)
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=your-bucket
```

**Production with Docker Compose:** Use the service name instead of localhost for internal communication:

```env
# Server-side (internal Docker network)
POCKETBASE_URL=http://pocketbase:8080

# Client-side (public URL)
NEXT_PUBLIC_POCKETBASE_URL=https://api.yourdomain.com
```

## Authentication

This starter uses PocketBase for authentication with a reactive auth provider.

### Client-side Auth

```typescript
import { useAuth } from "@/shared/providers/auth-provider";

function MyComponent() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <Skeleton />;
  if (!isAuthenticated) return <SignInPrompt />;

  return <div>Welcome, {user.name}!</div>;
}
```

### Sign In / Sign Out

```typescript
import { signIn, signOut, syncAuthCookie } from "@/shared/auth/client";

// Sign in
await signIn(email, password);
syncAuthCookie(); // Sync to cookie for server-side access

// Sign out
signOut(); // Clears auth store and cookie
```

### Server-side Auth

Server components can read auth state from cookies:

```typescript
import { cookies } from "next/headers";
import PocketBase from "pocketbase";

const cookieStore = await cookies();
const pb = new PocketBase(process.env.POCKETBASE_URL);

const authCookie = cookieStore.get("pb_auth");
if (authCookie?.value) {
  pb.authStore.loadFromCookie(`pb_auth=${authCookie.value}`);
}

const user = pb.authStore.isValid ? pb.authStore.record : null;
```

## PocketBase Clients

Three PocketBase clients are available for different contexts:

| Client      | Import                | Use Case                      | Singleton Safe?     |
| ----------- | --------------------- | ----------------------------- | ------------------- |
| `pbBrowser` | `@/shared/db/browser` | Client components (via proxy) | Yes (browser)       |
| `pbServer`  | `@/shared/db/server`  | Server components (read-only) | Unauthenticated only |
| `pbAdmin`   | `@/shared/db/admin`   | Server Actions (superuser)    | Yes                 |

**Important:** `pbAdmin` is the recommended way to interact with PocketBase from server-side code (Server Actions, API routes, webhooks). It authenticates as a superuser and is safe to use as a singleton because it doesn't track regular user auth state.

As [recommended by the PocketBase maintainer](https://github.com/pocketbase/pocketbase/discussions/5313):
> "You could create one-off node server-side actions that will interact with PocketBase only as admin/superuser and as pure data store"

**Never save a user token on a shared server client.** `pbServer` is cached for
the whole server process, so a user token saved on it leaks into every
concurrent request. For anything acting as the signed-in user, create a
PocketBase instance **per request** and pass it to the generated SDK with
`{ client: pb }` — see [Per-request PocketBase client](#per-request-pocketbase-client-server-auth).

`pbBrowser` is the pbkit-generated client singleton (`src/shared/db/generated/client.gen.ts`).
It is browser-oriented: its base URL is the relative `/api/pocketbase`, so it
goes through the rewrite proxy on the same origin.

> **Gotcha:** the stock `users` collection ships with `listRule: "id =
> @request.auth.id"`, so a signed-in user can only list *their own* record.
> Filtering on the `email` field returns nothing (the rule's `id` reference
> becomes ambiguous once the filter touches the auth table) — filter on `id` or
> `name`, or query as a superuser. This is PocketBase's own rule semantics,
> identical on every server version; it is not a proxy or codegen issue.

## Database codegen (pbkit)

Types, a typed SDK, Zod schemas and TanStack Query options are generated from
your PocketBase schema into `src/shared/db/generated/`:

```bash
bun run typegen   # pbkit generate
```

| Generated file    | Contents                                                                        |
| ----------------- | ------------------------------------------------------------------------------- |
| `types.gen.ts`    | `UsersRecord`, `UsersCreate`, `UsersUpdate`, `CollectionName`, …                 |
| `sdk.gen.ts`      | `getUser`, `listUsers`, `createUser`, … (typed `expand`, `{ client }` option)    |
| `client.gen.ts`   | the default PocketBase client (relative `/api/pocketbase`)                       |
| `zod.gen.ts`      | `UsersRecordSchema`, `UsersCreateSchema`, `UsersUpdateSchema` (field constraints) |
| `tanstack.gen.ts` | `userOptions`, `usersOptions`, `createUserMutationOptions`, `userQueryKey`, …    |

The generated files are **committed**, so `bun run build` works without a
running PocketBase.

**Rerun after every PocketBase schema change** (new or renamed collection or
field, changed rule or constraint):

```bash
# .env.local
PB_TYPEGEN_URL=http://127.0.0.1:8080      # falls back to POCKETBASE_URL
PB_TYPEGEN_EMAIL=admin@example.com        # superuser email...
PB_TYPEGEN_PASSWORD=secret                # ...and password, OR:
# PB_TYPEGEN_TOKEN=<superuser jwt>        # (falls back to POCKETBASE_ADMIN_TOKEN)
```

Generation needs superuser access to read the schema. Credentials live in
`.env.local` (gitignored) and are never written into `pbkit.config.ts`.
Rerunning on an unchanged schema produces no diff.

### Hand-written Zod: only what PocketBase can't know

Derive form schemas from the generated ones instead of retyping constraints:

```ts
const signUpSchema = UsersCreateSchema.pick({ email: true, password: true })
  .extend({
    name: z.string().min(2, "Name must be at least 2 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });
```

Hand-write only the rules PocketBase does not model: `confirmPassword` and the
"Passwords don't match" refinement (a form concern, not a schema field), and
`name` being required with a minimum length (PocketBase's `name` is optional
and unbounded). User-facing copy ("Please enter a valid email") is attached at
parse time through `authFormMessages`, passed to
`zodResolver(schema, { error: authFormMessages })`.

### Per-request PocketBase client (server auth)

The generated `client.gen.ts` is a **singleton**. On the server, a shared
instance whose `authStore` holds a user token leaks that user across concurrent
requests.

- `pbAdmin` is the one safe singleton: it authenticates as a superuser, not a user.
- `pbServer` is safe for unauthenticated reads only — never save a user token on it.
- For anything acting as the signed-in user, build a client **per request**:

```ts
import PocketBase from "pocketbase";
import { getUser } from "@/shared/db/generated/sdk.gen";

const pb = new PocketBase(process.env.POCKETBASE_URL);
pb.authStore.loadFromCookie(`pb_auth=${(await cookies()).get("pb_auth")?.value ?? ""}`);
const user = await getUser(pb.authStore.record.id, undefined, { client: pb });
```

The same `{ client }` argument threads through the generated TanStack options
(`userOptions(id, undefined, { client: pb })`) and mutations.

**Base URLs:** the generated client is browser-oriented (relative
`/api/pocketbase`, i.e. through the rewrite proxy); the server uses
`POCKETBASE_URL` directly. A single `sdk.baseUrl` cannot serve both, so server
code always passes its own client explicitly.

## PocketBase proxy (`/api/pocketbase/*`)

The app forwards a small, **explicit allowlist** of PocketBase routes through
`/api/pocketbase/*` (defined in `next.config.ts`). Anything **not** on the list
matches no rewrite, falls through to the Next.js router and returns **404**.
This is deliberate: a deny-list would keep the PocketBase admin UI and the
superuser endpoints one forgotten entry away from being exposed on the public
app domain again — an allowlist fails closed.

Deliberately **not** reachable through the app domain — each of these answers
a plain **404**:

- `/_/` — the PocketBase admin UI
- `/api/collections/_superusers/*` — superuser login and API
- `/api/backups`, `/api/settings`, `/api/logs`, `/api/crons` — superuser-only endpoints
- `/api/collections` — the schema listing

```bash
curl -i https://your-app.example.com/api/pocketbase/_/
# HTTP/2 404
```

> `next.config.ts` also sets `skipTrailingSlashRedirect: true`. Next's
> trailing-slash normalization (`308 /foo/` → `/foo`) runs *before* rewrites, so
> without it the admin path answered with a 308 redirect to the same 404.
> Routes still resolve with or without a trailing slash — only the canonical
> redirect is gone.

### Reaching the admin UI privately

The superuser never uses the app domain. Publish PocketBase on **loopback
only** and tunnel it over SSH:

```yaml
# docker-compose.admin.yml — local only, never committed
services:
  pocketbase:
    ports:
      - "127.0.0.1:8080:8080"
```

```bash
docker compose -f docker-compose.prod.yml -f docker-compose.admin.yml up -d
ssh -L 8080:127.0.0.1:8080 user@your-server
# then open http://127.0.0.1:8080/_/
```

On Coolify, the equivalent is a separate internal domain for the PocketBase
service, protected by basic auth or an IP allowlist. Never expose `/_/` through
the app domain.

### Trusted proxy / rate-limiting caveat

Behind the rewrite, **every** request reaching PocketBase comes from the Next
server's IP — PocketBase cannot see the real client IPs. Symptom: PocketBase's
per-IP rate limiting throttles **all** users at once (one user's burst counts
for everyone; you may see app-wide 429s). Fix: in the PocketBase settings, add
the Next server's IP to the **trusted proxy allowlist**, so PocketBase reads
the real client IP from `X-Forwarded-For` and rate-limits per actual client.

### Adding a new collection

The proxy only forwards the `users` collection (plus health, files and the
OAuth2 redirect). When you add a collection the browser client must reach, add
its routes to `POCKETBASE_PROXY_ROUTES` in `next.config.ts` — auth endpoints
and records, with the exact route **before** the `/:path*` one — or the client
will get 404s. Anything you don't add stays correctly unreachable from the
public domain.

## Deploying with Docker

The repo ships a production `Dockerfile` (multi-stage: Bun build → Node 22
standalone runtime, non-root uid 1001, ~324 MB) and `docker-compose.prod.yml`
(Next app + PocketBase). Only the app port is published; PocketBase stays on
the internal compose network.

### Run the production stack

```bash
PORT=3000 docker compose -f docker-compose.prod.yml up --build -d
```

- App: <http://localhost:3000> (`PORT` is the **host** port; the container
  always listens on 3000).
- PocketBase: **not published** — the browser reaches it through
  `/api/pocketbase/*`, proxied by Next.

Stop with `docker compose -f docker-compose.prod.yml down` (add `-v` to also
delete the `pb_data` volume).

### How the app talks to PocketBase

- **Server side** (server components, server actions, route handlers):
  `POCKETBASE_URL=http://pocketbase:8080` — the compose service name over the
  internal network.
- **Browser**: `/api/pocketbase/*`, rewritten by `next.config.ts` to
  `POCKETBASE_URL`. PocketBase itself is never exposed to the browser.

> **Build-time, not runtime:** `next.config.ts` reads `POCKETBASE_URL` when the
> build runs and bakes the rewrite target into the output
> (`routes-manifest.json`). Changing `POCKETBASE_URL` only at runtime does
> **not** change the proxy target — rebuild the image with the new value as a
> build arg. The compose file passes the same variable to both, so the baked
> target and the runtime URL can never disagree.

> **Cached prerender:** the homepage's PocketBase health widget is a `"use
> cache"` segment. PocketBase is normally unreachable from inside the build
> container, so the "Server Error" state gets baked into the static HTML and
> refreshes after the 15-minute revalidate window. The proxy itself works
> immediately.

### Coolify

Use either the compose file as a Compose resource, or two resources in the same
project (they share a Docker network, so the `pocketbase` service name
resolves).

**Build args vs runtime env — not interchangeable:**

| Variable | Build arg (`ARG` in Dockerfile) | Runtime env |
| --- | --- | --- |
| `NEXT_PUBLIC_*` (e.g. `NEXT_PUBLIC_POCKETBASE_URL`) | ✅ required — inlined by `next build` | ❌ no effect |
| `POCKETBASE_URL` | ✅ required — baked into the `/api/pocketbase` rewrite | ✅ also required — read at request time by server code |
| `POCKETBASE_ADMIN_TOKEN`, `R2_*`, `PB_TYPEGEN_*` | ❌ | ✅ server-only secrets |

In Coolify, put the build-time values under **Build Args** (Dockerfile build
pack) and the rest under **Environment Variables**. When you add a
`NEXT_PUBLIC_*` variable to the app, declare a matching `ARG` + `ENV` pair in
the Dockerfile's build stage or it will be `undefined` in the browser bundle.

**Runtime env for `next`:** `POCKETBASE_URL=http://pocketbase:8080`; plus
`POCKETBASE_ADMIN_TOKEN`, `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`,
`R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME` if used.

**Volumes:**

- `pb_data` → `/app/pb_data` — PocketBase database, uploads and backups.
  **The only stateful volume — back it up.**
- `./pocketbase/pb_hooks` → `/app/pb_hooks`, `./pocketbase/pb_migrations` →
  `/app/pb_migrations` — bind-mounted from the repo. Hook/migration changes
  apply with `restart pocketbase`, no image rebuild.

**Healthchecks:** the app image probes `/` with node's `fetch`; PocketBase
probes `/api/health`. `next` waits for PocketBase to be healthy
(`depends_on: service_healthy`).

### PocketBase backups and restore

- **Built-in:** dashboard → **Settings → Backups**. A new backup is a zip
  stored in `pb_data/backups` (inside the volume) and can be downloaded from
  the UI. Enable the automatic backup schedule there.
- **Copy off the volume** (survives losing the volume):

  ```bash
  docker run --rm -v <project>_pb_data:/data -v "$PWD":/out alpine \
    tar czf /out/pb_data-$(date +%F).tar.gz -C /data .
  ```

- **Restore:** put the backup zip in `pb_data/backups` (or upload it from the
  dashboard), then choose **Restore** on that entry — PocketBase restarts with
  the restored data. For a full volume restore: stop the stack, replace the
  contents of the `pb_data` volume, start again.
- **Superuser MFA:** create the superuser
  (`./pocketbase superuser create <email> <password>` inside the container) and
  enable MFA (TOTP) on the account in the dashboard before going live.
  PocketBase's own port is never published, so the admin UI is only reachable
  through the private route described in
  [PocketBase proxy](#pocketbase-proxy-apipocketbase).

### Local dev with the dev override

```bash
cp docker-compose.override.yml.example docker-compose.override.yml   # gitignored
docker compose up -d                                                 # PocketBase on 127.0.0.1:8080
bun dev
```

## Extending PocketBase

PocketBase can be extended with JavaScript hooks in `pocketbase/pb_hooks/`. Files are automatically reloaded on changes.

For full documentation, see [PocketBase JS Overview](https://pocketbase.io/docs/js-overview/).

### TypeScript Support

Add the reference directive for IDE autocompletion:

```javascript
/// <reference path="../pb_data/types.d.ts" />

routerAdd("GET", "/api/example", (e) => {
  // Full type hints available
});
```

## Features

- **Reactive Auth**: AuthProvider with `useSyncExternalStore` for instant UI updates
- **Server/Client Auth Sync**: Cookie-based auth sync between client and server
- **Loading States**: Built-in hydration handling to prevent UI flicker
- **Type-safe Forms**: Zod schemas with React Hook Form, derived from the generated PocketBase schema
- **Generated Backend**: types, typed SDK, Zod schemas and TanStack Query options from your PocketBase schema
- **Streaming**: React Suspense with server components
- **File Storage**: R2-compatible storage client
- **Extensible Backend**: Custom routes and hooks via PocketBase JS
- **Self-hosted Ready**: Docker Compose setup designed for Coolify deployment
