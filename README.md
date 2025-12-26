# Next.js Modern Starter

A production-ready Next.js starter with Feature-Sliced Design architecture.

## Tech Stack

- **Runtime**: [Bun](https://bun.sh/)
- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, React 19, Turbopack)
- **API**: [Elysia.js](https://elysiajs.com/) + [Eden Treaty](https://elysiajs.com/eden/overview.html)
- **Database**: [Drizzle ORM](https://orm.drizzle.team/) + [Supabase](https://supabase.com/) (PostgreSQL + Bun SQL driver)
- **Storage**: [Supabase Storage](https://supabase.com/docs/guides/storage)
- **Auth**: [Better Auth](https://www.better-auth.com/)
- **State**: [TanStack Query](https://tanstack.com/query)
- **UI**: [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **Validation**: [Zod](https://zod.dev/) + [React Hook Form](https://react-hook-form.com/)
- **Linting**: [Biome](https://biomejs.dev/)
- **Architecture**: [Feature-Sliced Design](https://feature-sliced.design/)

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) installed
- [Supabase](https://supabase.com/) account and project

### Setup

1. **Create a Supabase project**
   - Go to [supabase.com](https://supabase.com) and create a new project
   - Wait for the database to be ready

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Configure environment variables**
   ```bash
   # Copy the example env file
   cp .env.local.example .env.local

   # Generate Better Auth secret
   bunx @better-auth/cli secret
   ```

   Then edit `.env.local` and add your Supabase credentials:
   - `DATABASE_URL`: Get from Supabase Settings → Database → Connection Pooler (use Transaction mode)
   - `NEXT_PUBLIC_SUPABASE_URL`: Get from Supabase Settings → API → Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Get from Supabase Settings → API → Project API keys (anon/public)

4. **Push database schema to Supabase**
   ```bash
   bun db:push
   ```

5. **Start dev server**
   ```bash
   bun dev
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

See `.env.local.example` for all required variables:

```env
# Supabase Database (connection pooler for serverless)
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres

# Supabase API
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Better Auth
BETTER_AUTH_SECRET=your-secret-here
```

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

1. Go to your Supabase project → Storage
2. Create a new bucket (e.g., `avatars`, `documents`)
3. Configure bucket policies:
   - **Public bucket**: Anyone can read files
   - **Private bucket**: Requires authentication and RLS policies
4. Use the storage helpers in your code
