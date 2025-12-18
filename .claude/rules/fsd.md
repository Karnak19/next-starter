---
paths: src/**/*
---

# Feature-Sliced Design (FSD) Architecture

This project uses Feature-Sliced Design methodology. Follow these rules strictly.

## Layer Hierarchy

Code lives in `src/` with strict layer hierarchy. **Higher layers can only import from lower layers.**

```
src/
├── app/          # Layer 1: Providers, global config
├── pages/        # Layer 2: Page components (re-exported by Next.js routes)
├── widgets/      # Layer 3: Large composite UI blocks
├── features/     # Layer 4: User interactions and business logic
├── entities/     # Layer 5: Business domain models
└── shared/       # Layer 6: UI kit, utilities, API client, types
```

## Import Rules (CRITICAL)

| Layer    | Can Import From                            |
| -------- | ------------------------------------------ |
| app      | pages, widgets, features, entities, shared |
| pages    | widgets, features, entities, shared        |
| widgets  | features, entities, shared                 |
| features | entities, shared                           |
| entities | shared                                     |
| shared   | External packages only                     |

### Forbidden Patterns

- **Never import from higher layers** - entities cannot import from features
- **Never import slice internals** - use public API (`@/shared/ui`, not `@/shared/ui/button/button.tsx`)
- **Never cross-import same-layer slices** - `entities/user` cannot import from `entities/message`

## Path Aliases

- `@/*` → `./src/*` (FSD layers)
- `~/*` → `./*` (project root)

```typescript
// ✅ Correct
import { api } from "@/shared/api";
import { Button } from "@/shared/ui";
import { UserCard } from "@/entities/user";

// ❌ Wrong - importing slice internals
import { Button } from "@/shared/ui/button/button";

// ❌ Wrong - importing from higher layer
import { SendMessage } from "@/features/send-message"; // from entities layer
```

## Slice Structure

Each slice (folder within a layer) follows this structure:

```
slice-name/
├── index.ts          # Public API - ONLY exports allowed externally
├── ui/               # React components
├── model/            # Business logic, state, types, hooks
├── api/              # Queries, mutations, server actions
├── lib/              # Internal utilities
└── config/           # Configuration, constants
```

Segments are optional - only create the ones you need.

## Next.js Integration

Next.js `app/` folder handles routing at project root. Keep route files as thin re-exports:

```typescript
// app/chat/[threadId]/page.tsx
export { ThreadPage as default } from "@/pages/thread";
export { generateMetadata } from "@/pages/thread";
```

## Naming Conventions

- **Slices**: `kebab-case` (e.g., `send-message`, `chat-window`)
- **Components**: `kebab-case.tsx` (e.g., `send-message.tsx`)
- **Hooks**: `use-kebab-case.ts` (e.g., `use-send-message.ts`)
- **Features**: Named as actions (`send-message`, `create-thread`)
- **Entities**: Named as nouns (`user`, `message`, `thread`)

## State Management

- **Local state**: `useState`/`useReducer` in components
- **Feature state**: Zustand store in `feature/model/store.ts`
- **Server state**: React Query in `slice/api/queries.ts`
- **Server actions**: `"use server"` in `feature/api/actions.ts`

## Creating New Slices

When creating a new feature, entity, or widget:

1. Create the slice folder with kebab-case name
2. Add `index.ts` with public exports
3. Add segments as needed (ui/, model/, api/, lib/)
4. Only export what's needed externally via index.ts

Example for a new feature:

```
src/features/send-message/
├── index.ts              # export { SendMessageButton } from "./ui/send-message-button";
├── ui/
│   └── send-message-button.tsx
├── model/
│   └── use-send-message.ts
└── api/
    └── actions.ts        # "use server" actions
```
