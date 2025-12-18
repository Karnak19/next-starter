---
paths: src/shared/db/**/*
---

# Drizzle ORM Conventions

This project uses Drizzle ORM with PostgreSQL via Bun's native SQL driver.

## File Structure

```
src/shared/db/
├── client.ts           # Database connection (db instance)
├── index.ts            # Public API exports
└── schema/
    ├── index.ts        # Re-exports all schemas
    ├── auth.ts         # Better Auth tables (auto-generated)
    └── [domain].ts     # Your domain tables
```

## Creating New Tables

### 1. Create schema file

```typescript
// src/shared/db/schema/posts.ts
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { user } from "./auth";

export const post = pgTable("post", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  content: text("content"),
  authorId: text("author_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const postRelations = relations(post, ({ one }) => ({
  author: one(user, {
    fields: [post.authorId],
    references: [user.id],
  }),
}));

// Type helpers
export type Post = typeof post.$inferSelect;
export type NewPost = typeof post.$inferInsert;
```

### 2. Export from schema index

```typescript
// src/shared/db/schema/index.ts
export * from "./auth";
export * from "./posts";
```

### 3. Add to db client schema

```typescript
// src/shared/db/client.ts
import { post, postRelations } from "./schema";

export const db = drizzle({
  client,
  schema: {
    // ... existing
    post,
    postRelations,
  },
});
```

### 4. Push or migrate

```bash
bun db:push      # Dev: push schema directly
bun db:generate  # Prod: generate migration
bun db:migrate   # Prod: run migration
```

## Query Patterns

### Import the db instance

```typescript
import { db } from "@/shared/db";
import { post, user } from "@/shared/db";
```

### Select

```typescript
// All posts
const posts = await db.select().from(post);

// With conditions
const userPosts = await db
  .select()
  .from(post)
  .where(eq(post.authorId, userId));

// With relations (requires schema in db client)
const postsWithAuthor = await db.query.post.findMany({
  with: { author: true },
});

// Single record
const singlePost = await db.query.post.findFirst({
  where: eq(post.id, postId),
  with: { author: true },
});
```

### Insert

```typescript
// Single insert
const [newPost] = await db
  .insert(post)
  .values({
    title: "Hello",
    content: "World",
    authorId: userId,
  })
  .returning();

// Bulk insert
await db.insert(post).values([
  { title: "Post 1", authorId: userId },
  { title: "Post 2", authorId: userId },
]);
```

### Update

```typescript
await db
  .update(post)
  .set({ title: "Updated Title" })
  .where(eq(post.id, postId));
```

### Delete

```typescript
await db.delete(post).where(eq(post.id, postId));
```

## Schema Conventions

### Column Types

| Use Case              | Type                                              |
| --------------------- | ------------------------------------------------- |
| Primary key (random)  | `uuid("id").primaryKey().defaultRandom()`         |
| Primary key (string)  | `text("id").primaryKey()`                         |
| Foreign key           | `text("user_id").references(() => user.id)`       |
| Timestamps            | `timestamp("created_at").defaultNow().notNull()`  |
| Auto-update timestamp | `timestamp("updated_at").$onUpdate(() => new Date())` |
| Boolean               | `boolean("is_active").default(false).notNull()`   |
| Enum                  | `text("status").$type<"draft" \| "published">()` |

### Naming

- **Tables**: singular, snake_case (`post`, `user_profile`)
- **Columns**: snake_case (`created_at`, `author_id`)
- **Relations**: camelCase (`postRelations`, `userRelations`)
- **Indexes**: descriptive (`post_authorId_idx`)

### Always Include

```typescript
createdAt: timestamp("created_at").defaultNow().notNull(),
updatedAt: timestamp("updated_at")
  .defaultNow()
  .$onUpdate(() => new Date())
  .notNull(),
```

## FSD Integration

Database code lives in `@/shared/db`. Higher layers access it through:

1. **API routes** (`app/api/`) - Direct db access
2. **Server actions** (`src/features/*/api/actions.ts`) - Direct db access
3. **Server components** - Via Eden API calls (not direct db)

```typescript
// ✅ In API route or server action
import { db } from "@/shared/db";
const posts = await db.select().from(post);

// ❌ Don't import db directly in components
// Use Eden API instead
```

## Commands

```bash
bun db:generate   # Generate migration from schema changes
bun db:migrate    # Run pending migrations
bun db:push       # Push schema directly (dev only, no migration)
bun db:studio     # Open Drizzle Studio GUI
```

