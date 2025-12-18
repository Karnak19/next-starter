# Next.js Modern Starter

A production-ready Next.js starter with Feature-Sliced Design architecture.

## Tech Stack

- **Runtime**: [Bun](https://bun.sh/)
- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, React 19, Turbopack)
- **API**: [Elysia.js](https://elysiajs.com/) + [Eden Treaty](https://elysiajs.com/eden/overview.html)
- **Database**: [Drizzle ORM](https://orm.drizzle.team/) + PostgreSQL (Bun SQL driver)
- **Auth**: [Better Auth](https://www.better-auth.com/)
- **State**: [TanStack Query](https://tanstack.com/query)
- **UI**: [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **Validation**: [Zod](https://zod.dev/) + [React Hook Form](https://react-hook-form.com/)
- **Linting**: [Biome](https://biomejs.dev/)
- **Architecture**: [Feature-Sliced Design](https://feature-sliced.design/)

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) installed
- [Docker](https://www.docker.com/) for PostgreSQL

### Setup

```bash
# Install dependencies
bun install

# Start PostgreSQL
docker compose -f docker-compose.dev.yml up -d

# Generate auth secret and add to .env.local
bunx @better-auth/cli secret

# Push database schema
bun db:push

# Start dev server
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

Create `.env.local`:

```env
DATABASE_URL=postgresql://dev:devpass@localhost:5432/devdb
BETTER_AUTH_SECRET=your-secret-here
```

## Features

- **Type-safe API**: Elysia + Eden Treaty for end-to-end type safety
- **Isomorphic Eden**: Same API client works on server and client
- **Auth ready**: Email/password auth with Better Auth
- **Streaming**: React Suspense with server components
- **Fast DB**: Bun's native SQL driver with Drizzle ORM
