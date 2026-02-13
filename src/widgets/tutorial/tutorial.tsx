"use client";

import { useEffect, useState } from "react";
import { Button } from "@/shared/ui/button";

const STORAGE_KEY = "tutorial-dismissed";

const steps = [
  {
    title: "Docker Setup",
    description:
      "PocketBase runs in Docker. The base config is in docker-compose.yml, with dev overrides in docker-compose.dev.yml for port exposure.",
    code: `# Start services
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# View logs
docker logs -f pocketbase

# Stop services
docker compose down`,
    hint: "Data persists in a Docker volume. Use 'docker compose down -v' to reset everything.",
  },
  {
    title: "Authentication Ready",
    description:
      "Sign up and sign in works out of the box. Try it using the buttons in the header. Auth state syncs between client and server components.",
    code: `// Use the useAuth hook in any client component
import { useAuth } from "@/shared/providers/auth-provider";

function MyComponent() {
  const { user, isAuthenticated, isLoading } = useAuth();
  // ...
}`,
    hint: "Try signing up with any email/password to see it in action.",
  },
  {
    title: "PocketBase Backend",
    description:
      "PocketBase provides your database, auth, and file storage. Use pbAdmin for Server Actions - it's safe as a singleton since it doesn't track user auth state.",
    code: `// Client components (browser)
import { pbBrowser } from "@/shared/db/browser";

// Server Actions (use this for mutations!)
import { pbAdmin } from "@/shared/db/admin";

// Example Server Action
async function createPost(data: FormData) {
  "use server";
  await pbAdmin.collection("posts").create({ ... });
}`,
    hint: "Visit http://localhost:8080/_/ to access the PocketBase admin UI.",
  },
  {
    title: "Extend with Hooks",
    description:
      "Add custom API routes and event hooks in pocketbase/pb_hooks/. Changes auto-reload without restarting the server.",
    code: `// pocketbase/pb_hooks/main.pb.js

// Custom API endpoint
routerAdd("GET", "/api/custom/stats", (e) => {
  const count = $app.countRecords("posts");
  return e.json(200, { totalPosts: count });
});

// React to events
onRecordAfterCreateSuccess((e) => {
  console.log("New post:", e.record.get("title"));
  e.next();
}, "posts");`,
    hint: "Edit pb_hooks/main.pb.js and watch the logs with: docker logs -f pocketbase",
  },
  {
    title: "Feature-Sliced Design",
    description:
      "Code is organized by feature, not by type. This scales well as your app grows.",
    code: `src/
├── features/     # User interactions (forms, actions)
│   └── auth/     # Sign in, sign up forms
├── widgets/      # Composite UI blocks
│   └── user-menu/
└── shared/       # Reusable utilities
    ├── ui/       # shadcn/ui components
    ├── providers/# React context providers
    └── db/       # PocketBase clients`,
    hint: "Add new features in src/features/, new UI blocks in src/widgets/.",
  },
  {
    title: "R2 File Storage",
    description:
      "Configure Cloudflare R2 in PocketBase for scalable file storage. Go to Settings → Files storage in the admin dashboard.",
    code: `# R2 Configuration in PocketBase Admin
Endpoint:    https://<ACCOUNT_ID>.r2.cloudflarestorage.com
Bucket:      your-bucket-name
Region:      auto
Access Key:  your-access-key-id
Secret:      your-secret-access-key

# Optional: Force path style
Enable "Force path style addressing"`,
    hint: "Get R2 credentials from Cloudflare Dashboard → R2 → Manage R2 API Tokens.",
  },
  {
    title: "What's Next?",
    description: "You're ready to build! Here are some ideas to get started:",
    code: null,
    checklist: [
      "Create a new collection in PocketBase admin",
      "Build a feature to list and create records",
      "Add a custom hook for business logic",
      "Configure R2 for file uploads",
      "Deploy to Coolify (self-hosted)",
    ],
    hint: "Check the README.md for detailed documentation.",
  },
];

export function Tutorial() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isExpanded, setIsExpanded] = useState<boolean | null>(null);

  // Load dismissed state from localStorage
  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    setIsExpanded(dismissed !== "true");
  }, []);

  const handleDismiss = () => {
    setIsExpanded(false);
    localStorage.setItem(STORAGE_KEY, "true");
  };

  const handleReopen = () => {
    setIsExpanded(true);
    localStorage.removeItem(STORAGE_KEY);
  };

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  // Don't render until we know the dismissed state (prevents flash)
  if (isExpanded === null) {
    return null;
  }

  if (!isExpanded) {
    return (
      <button
        className="fixed right-6 bottom-6 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 text-white shadow-lg transition-transform hover:scale-105 dark:bg-zinc-100 dark:text-zinc-900"
        onClick={handleReopen}
        type="button"
      >
        <span className="text-lg">?</span>
      </button>
    );
  }

  return (
    <div className="fixed right-6 bottom-6 z-50 w-full max-w-xl rounded-xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
      {/* Header */}
      <div className="flex items-center justify-between border-zinc-200 border-b px-4 py-3 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            {currentStep + 1} / {steps.length}
          </span>
          <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
            {step.title}
          </span>
        </div>
        <button
          aria-label="Close tutorial"
          className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          onClick={handleDismiss}
          type="button"
        >
          <svg
            aria-hidden="true"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              d="M6 18L18 6M6 6l12 12"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
            />
          </svg>
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-zinc-100 dark:bg-zinc-800">
        <div
          className="h-full bg-zinc-900 transition-all duration-300 dark:bg-zinc-100"
          style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
        />
      </div>

      {/* Content */}
      <div className="max-h-80 overflow-y-auto p-4">
        <p className="text-sm text-zinc-600 leading-relaxed dark:text-zinc-400">
          {step.description}
        </p>

        {step.code && (
          <pre className="mt-4 overflow-x-auto rounded-lg bg-zinc-950 p-3 text-xs text-zinc-300">
            <code>{step.code}</code>
          </pre>
        )}

        {step.checklist && (
          <ul className="mt-4 space-y-2">
            {step.checklist.map((item) => (
              <li
                className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-400"
                key={item}
              >
                <span className="mt-0.5 text-zinc-400">○</span>
                {item}
              </li>
            ))}
          </ul>
        )}

        {step.hint && (
          <p className="mt-4 rounded-lg bg-zinc-100 p-3 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
            <span className="font-medium">Tip:</span> {step.hint}
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-zinc-200 border-t px-4 py-3 dark:border-zinc-800">
        <Button
          disabled={isFirstStep}
          onClick={() => setCurrentStep((s) => s - 1)}
          size="sm"
          variant="ghost"
        >
          Previous
        </Button>
        <Button
          onClick={() =>
            isLastStep ? handleDismiss() : setCurrentStep((s) => s + 1)
          }
          size="sm"
        >
          {isLastStep ? "Get Started" : "Next"}
        </Button>
      </div>
    </div>
  );
}
