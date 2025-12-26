import Image from "next/image";
import { Suspense } from "react";
import { Button } from "@/shared/ui";
import { HealthStatus, HealthStatusServer } from "@/widgets/health-status";
import { UserInfoContent, UserInfoSkeleton } from "@/widgets/user-info";
import { UserMenu } from "@/widgets/user-menu";

export function HomePage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="sticky top-0 z-10 border-zinc-200 border-b bg-white/80 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <div className="flex items-center gap-6">
            <Image
              alt="Next.js logo"
              className="dark:invert"
              height={18}
              priority
              src="/next.svg"
              width={90}
            />
            <div className="hidden items-center gap-2 sm:flex">
              <HealthStatusServer />
              <span className="text-zinc-300 dark:text-zinc-700">|</span>
              <HealthStatus />
            </div>
          </div>
          <UserMenu />
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-5xl px-6 py-16">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Hero Section */}
          <div className="flex flex-col justify-center gap-6">
            <h1 className="font-bold text-4xl text-zinc-900 tracking-tight lg:text-5xl dark:text-zinc-50">
              Next.js Modern Starter
            </h1>
            <p className="text-lg text-zinc-600 leading-relaxed dark:text-zinc-400">
              A production-ready starter with Feature-Sliced Design, Elysia.js
              API, Better Auth, Drizzle ORM, Supabase Storage, and TanStack
              Query.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <a
                  href="https://feature-sliced.design/"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  FSD Docs
                </a>
              </Button>
              <Button asChild variant="outline">
                <a
                  href="https://nextjs.org/docs"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Next.js Docs
                </a>
              </Button>
              <Button asChild variant="outline">
                <a
                  href="https://elysiajs.com/"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Elysia Docs
                </a>
              </Button>
            </div>
          </div>

          {/* User Info Card */}
          <div className="flex flex-col justify-center">
            <Suspense fallback={<UserInfoSkeleton />}>
              <UserInfoContent />
            </Suspense>
          </div>
        </div>

        {/* Stack Section */}
        <section className="mt-20">
          <h2 className="mb-8 font-semibold text-2xl text-zinc-900 dark:text-zinc-50">
            Tech Stack
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StackCard
              description="App Router, React 19, Turbopack"
              href="https://nextjs.org/docs"
              logo="https://nextjs.org/favicon.ico"
              title="Next.js 16"
            />
            <StackCard
              description="Type-safe API with Eden Treaty"
              href="https://elysiajs.com/"
              logo="https://elysiajs.com/assets/elysia.svg"
              title="Elysia.js"
            />
            <StackCard
              description="PostgreSQL with Bun SQL driver"
              href="https://orm.drizzle.team/"
              logo="https://orm.drizzle.team/favicon.ico"
              title="Drizzle ORM"
            />
            <StackCard
              description="Self-hosted storage with file operations"
              href="https://supabase.com/storage"
              logo="https://supabase.com/favicon/favicon-196x196.png"
              title="Supabase Storage"
            />
            <StackCard
              description="Email/password, sessions, OAuth ready"
              href="https://www.better-auth.com/"
              logo="https://www.better-auth.com/logo.png"
              title="Better Auth"
            />
            <StackCard
              description="Server state with query options"
              href="https://tanstack.com/query"
              logo="https://tanstack.com/images/logos/logo-color-banner-600.png"
              title="TanStack Query"
            />
            <StackCard
              description="Layered architecture for scalability"
              href="https://feature-sliced.design/"
              logo="https://feature-sliced.design/img/brand/logo-primary.png"
              title="Feature-Sliced Design"
            />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-zinc-200 border-t dark:border-zinc-800">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-center px-6">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Edit{" "}
            <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-xs dark:bg-zinc-800">
              src/pages/home/ui/home-page.tsx
            </code>{" "}
            to get started.
          </p>
        </div>
      </footer>
    </div>
  );
}

function StackCard({
  title,
  description,
  href,
  logo,
}: {
  title: string;
  description: string;
  href: string;
  logo: string;
}) {
  return (
    <a
      className="group flex items-start gap-4 rounded-lg border border-zinc-200 bg-white p-5 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:hover:bg-zinc-800/50"
      href={href}
      rel="noopener noreferrer"
      target="_blank"
    >
      {/** biome-ignore lint/performance/noImgElement: this is temporary component */}
      <img
        alt={`${title} logo`}
        className="size-10 shrink-0"
        height={40}
        src={logo}
        width={40}
      />
      <div className="min-w-0 flex-1">
        <h3 className="font-medium text-zinc-900 group-hover:text-zinc-700 dark:text-zinc-100 dark:group-hover:text-zinc-50">
          {title}
          <span className="ml-1 inline-block transition-transform group-hover:translate-x-0.5">
            →
          </span>
        </h3>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {description}
        </p>
      </div>
    </a>
  );
}
