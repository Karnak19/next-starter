# Data Access Layer (DAL)

A clean, maintainable data access layer using the Repository Pattern. This makes it easy to swap databases or ORMs without changing your business logic.

## Architecture

```
src/shared/dal/
├── types.ts                    # Core interfaces and types
├── drizzle-base-repository.ts  # Base Drizzle implementation
├── container.ts                # Dependency injection container
├── repositories/
│   ├── user-repository.ts      # User data access
│   └── session-repository.ts   # Session data access
└── index.ts                    # Public exports
```

## Key Benefits

1. **Easy to Replace**: Swap Drizzle for Prisma, TypeORM, or even a REST API without changing business logic
2. **Type Safety**: Full TypeScript support with interfaces
3. **Testable**: Mock repositories in tests
4. **Centralized**: All data access in one place
5. **Domain-Focused**: Repository methods match business needs

## Quick Start

### Basic Usage

```typescript
import { getRepositories } from "@/shared/dal";

// In a Server Component or API route
export async function getUser(userId: string) {
  const repos = getRepositories();

  // Find user by ID
  const user = await repos.users.findById(userId);

  return user;
}
```

### Create

```typescript
const repos = getRepositories();

const newUser = await repos.users.create({
  name: "John Doe",
  email: "john@example.com",
  emailVerified: false,
});
```

### Read

```typescript
const repos = getRepositories();

// Find by ID
const user = await repos.users.findById("user-123");

// Find by email
const user = await repos.users.findByEmail("john@example.com");

// Find with filters
const users = await repos.users.findMany({
  filters: [
    { field: "emailVerified", operator: "eq", value: true }
  ],
  orderBy: [
    { field: "createdAt", direction: "desc" }
  ],
  pagination: { limit: 10, offset: 0 }
});

// Paginated results
const result = await repos.users.findPaginated({
  pagination: { limit: 20, offset: 0 }
});
// result.items, result.total, result.limit, result.offset
```

### Update

```typescript
const repos = getRepositories();

const updatedUser = await repos.users.update("user-123", {
  name: "Jane Doe",
  emailVerified: true,
});
```

### Delete

```typescript
const repos = getRepositories();

await repos.users.delete("user-123");
```

## Domain-Specific Methods

Each repository has methods specific to its domain:

### User Repository

```typescript
const repos = getRepositories();

// Check if email exists
const exists = await repos.users.emailExists("john@example.com");

// Verify user's email
await repos.users.verifyEmail("user-123");

// Get all verified users
const verified = await repos.users.findVerifiedUsers();
```

### Session Repository

```typescript
const repos = getRepositories();

// Find by token
const session = await repos.sessions.findByToken("token-abc");

// Get user's active sessions
const sessions = await repos.sessions.findActiveSessionsByUserId("user-123");

// Delete all user sessions (logout everywhere)
await repos.sessions.deleteByUserId("user-123");

// Clean up expired sessions
const deletedCount = await repos.sessions.deleteExpired();
```

## How to Swap Implementations

The beauty of the Repository Pattern is that you can swap the underlying technology without changing your business logic.

### Example: Switching from Drizzle to Prisma

1. **Create new implementations**:

```typescript
// src/shared/dal/prisma-user-repository.ts
import { PrismaClient } from '@prisma/client';
import type { IUserRepository, User } from './repositories/user-repository';

export class PrismaUserRepository implements IUserRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  // ... implement all methods from IUserRepository
}
```

2. **Update the container**:

```typescript
// src/shared/dal/container.ts
export function createRepositoryContainer(): IRepositoryContainer {
  const prisma = new PrismaClient();

  return {
    users: new PrismaUserRepository(prisma),
    sessions: new PrismaSessionRepository(prisma),
  };
}
```

3. **That's it!** All your business logic continues to work without changes.

## Adding New Repositories

1. **Define the interface**:

```typescript
// src/shared/dal/repositories/product-repository.ts
export interface Product extends BaseEntity {
  name: string;
  price: number;
}

export interface IProductRepository extends IRepository<Product> {
  findByPriceRange(min: number, max: number): Promise<Product[]>;
}
```

2. **Implement with Drizzle**:

```typescript
export class DrizzleProductRepository
  extends DrizzleBaseRepository<Product>
  implements IProductRepository
{
  constructor(db: Database) {
    super(db, productTable);
  }

  async findByPriceRange(min: number, max: number): Promise<Product[]> {
    return this.db
      .select()
      .from(productTable)
      .where(and(
        gte(productTable.price, min),
        lte(productTable.price, max)
      ));
  }
}
```

3. **Add to container**:

```typescript
export interface IRepositoryContainer {
  users: IUserRepository;
  sessions: ISessionRepository;
  products: IProductRepository; // Add here
}

export function createRepositoryContainer(): IRepositoryContainer {
  return {
    users: new DrizzleUserRepository(db),
    sessions: new DrizzleSessionRepository(db),
    products: new DrizzleProductRepository(db), // And here
  };
}
```

## Testing

Mock repositories in your tests:

```typescript
import type { IUserRepository } from "@/shared/dal";

const mockUserRepo: IUserRepository = {
  findById: vi.fn().mockResolvedValue({ id: "1", name: "Test User" }),
  create: vi.fn(),
  // ... other methods
};

// Inject mock in tests
const repos = {
  users: mockUserRepo,
  sessions: mockSessionRepo,
};
```

## Best Practices

1. **Always use the container**: Don't instantiate repositories directly
2. **Keep repositories focused**: Each repository should handle one entity
3. **Add domain methods**: If you frequently query in a specific way, add a method
4. **Use interfaces**: Code against `IUserRepository`, not `DrizzleUserRepository`
5. **Server-only**: Repositories should only be used in server code (API routes, Server Components)

## Example: Using in an API Route

```typescript
// app/api/users/[id]/route.ts
import { getRepositories } from "@/shared/dal";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const repos = getRepositories();

  const user = await repos.users.findById(params.id);

  if (!user) {
    return NextResponse.json(
      { error: "User not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(user);
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const repos = getRepositories();
  const body = await request.json();

  const updatedUser = await repos.users.update(params.id, body);

  return NextResponse.json(updatedUser);
}
```

## Example: Using in a Server Component

```typescript
// app/users/[id]/page.tsx
import { getRepositories } from "@/shared/dal";

export default async function UserPage({ params }: { params: { id: string } }) {
  const repos = getRepositories();

  const [user, sessions] = await Promise.all([
    repos.users.findById(params.id),
    repos.sessions.findActiveSessionsByUserId(params.id),
  ]);

  if (!user) {
    return <div>User not found</div>;
  }

  return (
    <div>
      <h1>{user.name}</h1>
      <p>Email: {user.email}</p>
      <p>Active Sessions: {sessions.length}</p>
    </div>
  );
}
```
