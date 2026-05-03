# Next.js Modern Starter

A production-ready Next.js starter with Feature-Sliced Design architecture, designed for self-hosting with [Coolify](https://coolify.io/).

## Tech Stack

- **Runtime**: [Bun](https://bun.sh/)
- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, React 19, Turbopack)
- **Backend**: [PocketBase](https://pocketbase.io/) (Auth, Database, File Storage)
- **Storage**: [Cloudflare R2](https://developers.cloudflare.com/r2/) (S3-compatible object storage)
- **State**: [TanStack Query](https://tanstack.com/query)
- **UI**: [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **Validation**: [Zod](https://zod.dev/) + [React Hook Form](https://react-hook-form.com/)
- **Linting**: [Biome](https://biomejs.dev/)
- **Codegen**: [pbkit](https://github.com/Karnak19/pbkit) (PocketBase typed SDK + TanStack Query)
- **Architecture**: [Feature-Sliced Design](https://feature-sliced.design/)
- **Deployment**: [Coolify](https://coolify.io/) (self-hosted PaaS)

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) installed
- [Docker](https://www.docker.com/) and Docker Compose

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

4. **Generate types & SDK**

   ```bash
   bun run typegen
   ```

   This runs [pbkit](https://github.com/Karnak19/pbkit) to generate typed PocketBase SDK functions and TanStack Query options in `src/shared/db/generated/`. Requires PocketBase to be running (from step 2).

   Regenerate after any schema change: `bun run typegen`

5. **Start dev server**
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
│       ├── db/             # PocketBase clients + pbkit generated code
│       │   ├── generated/  # Auto-generated types, SDK, TanStack hooks (pbkit)
│       │   ├── browser.ts  # Browser PB client
│       │   ├── server.ts   # Server PB client
│       │   └── admin.ts    # Admin PB client (superuser)
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
bun run typegen   # Generate PocketBase types, SDK, and TanStack Query options
```

## Environment Variables

See `.env.local.example` for all variables. Local development defaults:

```env
# PocketBase
POCKETBASE_URL=http://127.0.0.1:8080

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

| Client      | Import                | Use Case                      | Singleton Safe? |
| ----------- | --------------------- | ----------------------------- | --------------- |
| `pbBrowser` | `@/shared/db/browser` | Client components (via proxy) | Yes (browser)   |
| `pbServer`  | `@/shared/db/server`  | Server components (read-only) | No*             |
| `pbAdmin`   | `@/shared/db/admin`   | Server Actions (superuser)    | Yes             |

**Important:** `pbAdmin` is the recommended way to interact with PocketBase from server-side code (Server Actions, API routes, webhooks). It authenticates as a superuser and is safe to use as a singleton because it doesn't track regular user auth state.

As [recommended by the PocketBase maintainer](https://github.com/pocketbase/pocketbase/discussions/5313):
> "You could create one-off node server-side actions that will interact with PocketBase only as admin/superuser and as pure data store"

*`pbServer` creates a new instance per request in server components to safely read user-specific data via cookies.

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

## Type-safe SDK with pbkit

[pbkit](https://github.com/Karnak19/pbkit) generates type-safe PocketBase SDK functions and TanStack Query options from your schema.

### Generated files (`src/shared/db/generated/`)

| File | Contents |
|------|----------|
| `types.gen.ts` | Record types (`UsersRecord`, `UsersCreate`, `UsersUpdate`, etc.) |
| `client.gen.ts` | Default PocketBase client singleton |
| `sdk.gen.ts` | CRUD functions (`getUser`, `listUsers`, `createUser`, etc.) |
| `tanstack.gen.ts` | TanStack Query options (`userOptions`, `usersOptions`, `createUserMutationOptions`, etc.) |

### Usage

```typescript
// Server component — get a single record
import { getUser } from "@/shared/db/generated/sdk.gen";
import { pbServer } from "@/shared/db/server";

const user = await getUser(id, undefined, { client: pbServer });

// Client component — TanStack Query
import { userOptions } from "@/shared/db/generated/tanstack.gen";

function MyComponent({ id }: { id: string }) {
  const { data } = useQuery(userOptions(id));
  return <div>{data?.name}</div>;
}
```

### Configuration

Edit `pbkit.config.ts` at the project root. By default it reads `PB_TYPEGEN_URL` or `POCKETBASE_URL` from your environment.

## Features

- **Reactive Auth**: AuthProvider with `useSyncExternalStore` for instant UI updates
- **Server/Client Auth Sync**: Cookie-based auth sync between client and server
- **Loading States**: Built-in hydration handling to prevent UI flicker
- **Type-safe Forms**: Zod schemas with React Hook Form
- **Streaming**: React Suspense with server components
- **File Storage**: R2-compatible storage client
- **Extensible Backend**: Custom routes and hooks via PocketBase JS
- **Self-hosted Ready**: Docker Compose setup designed for Coolify deployment
