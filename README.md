# Next.js Modern Starter

A production-ready Next.js starter with Feature-Sliced Design architecture.

## Tech Stack

- **Runtime**: [Bun](https://bun.sh/)
- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, React 19, Turbopack)
- **API**: [Elysia.js](https://elysiajs.com/) + [Eden Treaty](https://elysiajs.com/eden/overview.html)
- **Database**: [Drizzle ORM](https://orm.drizzle.team/) + [Supabase](https://supabase.com/) (Self-hosted PostgreSQL + Bun SQL driver)
- **Storage**: [Supabase Storage](https://supabase.com/docs/guides/storage) (Self-hosted)
- **Auth**: [Better Auth](https://www.better-auth.com/)
- **State**: [TanStack Query](https://tanstack.com/query)
- **UI**: [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **Validation**: [Zod](https://zod.dev/) + [React Hook Form](https://react-hook-form.com/)
- **Linting**: [Biome](https://biomejs.dev/)
- **Architecture**: [Feature-Sliced Design](https://feature-sliced.design/)

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) installed
- [Docker](https://www.docker.com/) for running Supabase locally
- [Supabase CLI](https://supabase.com/docs/guides/cli/getting-started) - Install with:
  ```bash
  npm install -g supabase
  # or
  brew install supabase/tap/supabase
  ```

### Setup

1. **Install dependencies**
   ```bash
   bun install
   ```

2. **Initialize Supabase locally**
   ```bash
   supabase init
   ```

3. **Start local Supabase stack**
   ```bash
   supabase start
   ```

   This will start all Supabase services in Docker containers. The command outputs your local credentials - save these!

4. **Configure environment variables**
   ```bash
   # Copy the example env file
   cp .env.local.example .env.local

   # Generate Better Auth secret
   bunx @better-auth/cli secret
   ```

   Edit `.env.local` and update if needed (the example file has local defaults):
   - `DATABASE_URL`: Direct connection to local Postgres (default: `postgresql://postgres:postgres@localhost:54322/postgres`)
   - `NEXT_PUBLIC_SUPABASE_URL`: Local API URL (default: `http://localhost:54321`)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Copy from `supabase start` output
   - `BETTER_AUTH_SECRET`: Your generated secret

5. **Push database schema**
   ```bash
   bun db:push
   ```

6. **Start dev server**
   ```bash
   bun dev
   ```

7. **Access Supabase Studio** (optional)
   - Open http://localhost:54323 to manage your database, storage, and auth

**Stopping Supabase:**
```bash
supabase stop
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Project Structure

```
├── app/                    # Next.js App Router (routing only)
├── src/                    # Feature-Sliced Design layers
│   ├── app/                # Providers, global config
│   ├── pages/              # Page components
│   ├── widgets/            # Composite UI blocks
│   ├── features/           # User interactions
│   ├── entities/           # Business domain models
│   └── shared/             # UI kit, API client, utilities
│       ├── api/            # Eden Treaty clients
│       ├── auth/           # Better Auth config
│       ├── db/             # Drizzle ORM + schema
│       ├── storage/        # Supabase storage client
│       ├── lib/            # Utilities (cn, query client)
│       └── ui/             # shadcn/ui components
├── drizzle/                # Database migrations
└── pages/                  # Empty (prevents Pages Router conflict)
```

## Scripts

```bash
bun dev           # Start dev server
bun build         # Build for production
bun start         # Start production server
bun lint          # Run Biome linter
bun format        # Format code with Biome

bun db:generate   # Generate migrations
bun db:migrate    # Run migrations
bun db:push       # Push schema (dev only)
bun db:studio     # Open Drizzle Studio
```

## Environment Variables

See `.env.local.example` for all variables. For local development with self-hosted Supabase:

```env
# Local Supabase (self-hosted)
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from-supabase-start-output>

# Better Auth
BETTER_AUTH_SECRET=<your-generated-secret>
```

For production with Supabase Cloud, see the commented section in `.env.local.example`.

## Features

- **Type-safe API**: Elysia + Eden Treaty for end-to-end type safety
- **Isomorphic Eden**: Same API client works on server and client
- **Auth ready**: Email/password auth with Better Auth
- **Streaming**: React Suspense with server components
- **Fast DB**: Bun's native SQL driver with Drizzle ORM + Supabase Postgres
- **File storage**: Supabase Storage with helper functions for uploads, downloads, and signed URLs

## Using Supabase Storage

The storage client is available at `src/shared/storage/`. Example usage:

```typescript
import { storage } from '@/shared/storage';

// Upload a file
const file = new File(['content'], 'example.txt');
await storage.uploadFile('bucket-name', 'path/to/file.txt', file);

// Get public URL
const url = storage.getPublicUrl('bucket-name', 'path/to/file.txt');

// Create signed URL for private files
const { signedUrl } = await storage.createSignedUrl('bucket-name', 'path/to/file.txt', 3600);

// List files
const files = await storage.listFiles('bucket-name', 'optional/folder/path');

// Download a file
const blob = await storage.downloadFile('bucket-name', 'path/to/file.txt');

// Delete files
await storage.deleteFile('bucket-name', 'path/to/file.txt');
await storage.deleteFile('bucket-name', ['file1.txt', 'file2.txt']); // Multiple files
```

### Setting up Storage Buckets

1. Open Supabase Studio at http://localhost:54323
2. Navigate to Storage in the sidebar
3. Create a new bucket (e.g., `avatars`, `documents`)
4. Configure bucket policies:
   - **Public bucket**: Anyone can read files
   - **Private bucket**: Requires authentication and RLS policies
5. Use the storage helpers in your code

For production/cloud Supabase, access the dashboard at your project URL instead.
