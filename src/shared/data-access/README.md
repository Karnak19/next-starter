# Data Access Layer

Simple pattern for organizing database queries. Keep your Elysia endpoints clean by putting all database logic in dedicated files.

## Structure

```
src/shared/data-access/
├── posts.ts          # Post-related queries
├── comments.ts       # Comment-related queries
└── index.ts          # Export all functions
```

## Pattern

Each file contains simple functions that interact with the database:

```typescript
// src/shared/data-access/posts.ts
import "server-only";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { post } from "../db/schema";

export async function getPostById(id: string) {
  const [result] = await db
    .select()
    .from(post)
    .where(eq(post.id, id))
    .limit(1);
  return result ?? null;
}

export async function getAllPosts() {
  return db.select().from(post);
}

export async function createPost(data: { title: string; content: string }) {
  const [newPost] = await db
    .insert(post)
    .values({
      id: crypto.randomUUID(),
      ...data,
    })
    .returning();
  return newPost;
}
```

## Usage in Elysia Endpoints

```typescript
// app/api/[[...slugs]]/route.ts
import { Elysia } from "elysia";
import { getPostById, getAllPosts, createPost } from "@/shared/data-access";

export const app = new Elysia({ prefix: "/api" })
  .get("/posts", async () => {
    const posts = await getAllPosts();
    return posts;
  })
  .get("/posts/:id", async ({ params }) => {
    const post = await getPostById(params.id);
    if (!post) {
      throw new Error("Post not found");
    }
    return post;
  })
  .post("/posts", async ({ body }) => {
    const post = await createPost(body);
    return post;
  });
```

## Why This Pattern?

1. **Separation of concerns**: Database logic separate from API logic
2. **Reusable**: Use the same functions in Server Components, API routes, server actions
3. **Easy to test**: Mock these functions in tests
4. **Easy to migrate**: If you switch ORMs, just update these files
5. **Type-safe**: Full TypeScript support

## Example: Adding a New Entity

1. **Create the schema**:

```typescript
// src/shared/db/schema/posts.ts
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const post = pgTable("post", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});
```

2. **Create data access functions**:

```typescript
// src/shared/data-access/posts.ts
import "server-only";
import { db } from "../db/client";
import { post } from "../db/schema";
import { eq } from "drizzle-orm";

export async function getPostById(id: string) {
  const [result] = await db.select().from(post).where(eq(post.id, id)).limit(1);
  return result ?? null;
}

export async function getAllPosts() {
  return db.select().from(post);
}

export async function createPost(data: { title: string; content: string }) {
  const [newPost] = await db
    .insert(post)
    .values({
      id: crypto.randomUUID(),
      ...data,
    })
    .returning();
  return newPost;
}

export async function updatePost(
  id: string,
  data: { title?: string; content?: string },
) {
  const [updated] = await db
    .update(post)
    .set(data)
    .where(eq(post.id, id))
    .returning();
  return updated ?? null;
}

export async function deletePost(id: string) {
  await db.delete(post).where(eq(post.id, id));
}
```

3. **Export from index**:

```typescript
// src/shared/data-access/index.ts
export * from "./posts";
```

4. **Use in your API**:

```typescript
import { getAllPosts, createPost } from "@/shared/data-access";

const app = new Elysia()
  .get("/posts", () => getAllPosts())
  .post("/posts", ({ body }) => createPost(body));
```

That's it! Simple, clean, and easy to understand.
