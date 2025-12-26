# Next.js Modern Starter

A production-ready Next.js starter with Feature-Sliced Design architecture.

## Tech Stack

- **Runtime**: [Bun](https://bun.sh/)
- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, React 19, Turbopack)
- **API**: [Elysia.js](https://elysiajs.com/) + [Eden Treaty](https://elysiajs.com/eden/overview.html)
- **Database**: [Drizzle ORM](https://orm.drizzle.team/) + [Supabase Postgres](https://supabase.com/docs/guides/database) (Bun SQL driver)
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
- [Docker](https://www.docker.com/) and Docker Compose

### Setup

1. **Install dependencies**
   ```bash
   bun install
   ```

2. **Start Supabase services**
   ```bash
   docker compose -f docker-compose.dev.yml up -d
   ```

   This starts self-hosted Supabase with:
   - **Postgres** on port 5432
   - **Storage API** via Kong gateway on port 8000
   - **PostgREST** for database API
   - **ImgProxy** for image transformations

3. **Configure environment variables**
   ```bash
   # Copy the example env file
   cp .env.local.example .env.local

   # Generate Better Auth secret
   bunx @better-auth/cli secret
   ```

   The `.env.local.example` has defaults that work out of the box. Update `BETTER_AUTH_SECRET` with your generated value.

4. **Create storage buckets**

   You can create buckets either via SQL or using the Supabase client:

   **Via SQL:**
   ```sql
   -- Connect to postgres and run:
   INSERT INTO storage.buckets (id, name, public)
   VALUES ('avatars', 'avatars', true);
   ```

   **Or via code:**
   ```typescript
   import { supabase } from '@/shared/storage';
   await supabase.storage.createBucket('avatars', { public: true });
   ```

5. **Push database schema**
   ```bash
   bun db:push
   ```

6. **Start dev server**
   ```bash
   bun dev
   ```

**Stopping services:**
```bash
docker compose -f docker-compose.dev.yml down
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

See `.env.local.example` for all variables. Local development defaults:

```env
# Database (Supabase Postgres)
DATABASE_URL=postgresql://postgres:your-super-secret-and-long-postgres-password@localhost:5432/postgres

# Supabase API (Kong gateway)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_ANON_KEY=<default-anon-key-in-example-file>

# Better Auth
BETTER_AUTH_SECRET=<your-generated-secret>
```

The `.env.local.example` file includes default JWT tokens for local development. For production, generate new secrets.

## Features

- **Type-safe API**: Elysia + Eden Treaty for end-to-end type safety
- **Isomorphic Eden**: Same API client works on server and client
- **Auth ready**: Email/password auth with Better Auth
- **Streaming**: React Suspense with server components
- **Fast DB**: Bun's native SQL driver with Drizzle ORM + Supabase Postgres
- **File storage**: Supabase Storage with self-hosted setup

## Using Supabase Storage

The storage client is available at `src/shared/storage/`. It uses the official `@supabase/supabase-js` client to work with your self-hosted Supabase instance.

**Example usage:**

```typescript
import { storage } from '@/shared/storage';

// Upload a file
const file = new File(['content'], 'example.txt');
await storage.uploadFile('avatars', 'user/profile.jpg', file);

// Get public URL
const url = storage.getPublicUrl('avatars', 'user/profile.jpg');

// Create signed URL for private files (expires in 60 seconds)
const { signedUrl } = await storage.createSignedUrl('avatars', 'user/profile.jpg', 60);

// List files
const files = await storage.listFiles('avatars', 'user/');

// Download a file
const blob = await storage.downloadFile('avatars', 'user/profile.jpg');

// Delete files
await storage.deleteFile('avatars', 'user/profile.jpg');
await storage.deleteFile('avatars', ['file1.jpg', 'file2.jpg']); // Multiple files
```

### Setting up Storage Buckets

Buckets must be created before you can upload files. You have several options:

**Option 1: Via SQL** (Connect to postgres at localhost:5432)
```sql
-- Create a public bucket for avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

-- Create a private bucket for documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false);
```

**Option 2: Via Supabase client**
```typescript
import { supabase } from '@/shared/storage';

// Create public bucket
await supabase.storage.createBucket('avatars', { public: true });

// Create private bucket
await supabase.storage.createBucket('documents', { public: false });
```

**Option 3: Via REST API**
```bash
curl -X POST http://localhost:8000/storage/v1/bucket \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"id":"avatars","name":"avatars","public":true}'
```

### Access Policies

For private buckets, you can set up Row Level Security (RLS) policies in Postgres to control access. The self-hosted setup includes the storage schema with all necessary tables.
