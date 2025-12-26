# Next.js Modern Starter

A production-ready Next.js starter with Feature-Sliced Design architecture.

## Tech Stack

- **Runtime**: [Bun](https://bun.sh/)
- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, React 19, Turbopack)
- **API**: [Elysia.js](https://elysiajs.com/) + [Eden Treaty](https://elysiajs.com/eden/overview.html)
- **Database**: [Drizzle ORM](https://orm.drizzle.team/) + PostgreSQL (Bun SQL driver)
- **Storage**: [MinIO](https://min.io/) (S3-compatible object storage)
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

2. **Start database and storage**
   ```bash
   docker compose -f docker-compose.dev.yml up -d
   ```

   This starts:
   - **PostgreSQL** on port 5432
   - **MinIO** on port 9000 (API) and 9001 (Console)

3. **Configure environment variables**
   ```bash
   # Copy the example env file
   cp .env.local.example .env.local

   # Generate Better Auth secret
   bunx @better-auth/cli secret
   ```

   The `.env.local.example` has defaults that work out of the box. Update `BETTER_AUTH_SECRET` with your generated value.

4. **Create MinIO bucket** (first time only)
   - Open MinIO Console at http://localhost:9001
   - Login with `minioadmin` / `minioadmin`
   - Go to "Buckets" → "Create Bucket"
   - Create a bucket named `uploads` (or whatever you set in `S3_BUCKET`)
   - Set bucket access policy to public if needed

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
│       ├── storage/        # S3/MinIO storage client
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
# Database
DATABASE_URL=postgresql://dev:devpass@localhost:5432/devdb

# MinIO Storage
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin
S3_BUCKET=uploads

# Better Auth
BETTER_AUTH_SECRET=<your-generated-secret>
```

For production with AWS S3 or other providers, update the S3 settings accordingly.

## Features

- **Type-safe API**: Elysia + Eden Treaty for end-to-end type safety
- **Isomorphic Eden**: Same API client works on server and client
- **Auth ready**: Email/password auth with Better Auth
- **Streaming**: React Suspense with server components
- **Fast DB**: Bun's native SQL driver with Drizzle ORM
- **File storage**: S3-compatible storage (MinIO) using Bun's built-in crypto for AWS signature v4

## Using Object Storage

The storage client is available at `src/shared/storage/`. It uses Bun's native APIs (fetch + crypto) to work with MinIO locally and any S3-compatible service in production. No external dependencies needed.

**Example usage:**

```typescript
import { storage } from '@/shared/storage';

// Upload a file (uses default bucket from env)
const file = new File(['content'], 'example.txt');
await storage.uploadFile('path/to/file.txt', file);

// Or specify a bucket
await storage.uploadFile('my-bucket', 'path/to/file.txt', file);

// Get public URL
const url = storage.getPublicUrl('path/to/file.txt');

// Create signed URL for private files (expires in 3600 seconds)
const { signedUrl } = await storage.createSignedUrl('path/to/file.txt', 3600);

// List files
const { files } = await storage.listFiles();
const { files: prefixed } = await storage.listFiles('my-bucket', 'folder/');

// Download a file
const blob = await storage.downloadFile('path/to/file.txt');

// Delete files
await storage.deleteFile('path/to/file.txt');
await storage.deleteFile('my-bucket', ['file1.txt', 'file2.txt']); // Multiple files
```

### Setting up Storage Buckets

**Local (MinIO):**
1. Open MinIO Console at http://localhost:9001
2. Login with `minioadmin` / `minioadmin`
3. Click "Buckets" → "Create Bucket"
4. Name it (e.g., `uploads`, `avatars`, `documents`)
5. Set access policy if needed (public/private)

**Production (AWS S3, DigitalOcean Spaces, etc.):**
- Create bucket in your provider's dashboard
- Update environment variables with your credentials
- The same storage helpers work without code changes
