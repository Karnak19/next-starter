/**
 * User Repository
 *
 * Domain-specific data access for Users
 */

import { eq } from "drizzle-orm";
import type { Database } from "../../db/client";
import { user as userTable } from "../../db/schema";
import { DrizzleBaseRepository } from "../drizzle-base-repository";
import type { BaseEntity, IRepository } from "../types";

/**
 * User entity type
 */
export interface User extends BaseEntity {
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
}

/**
 * Data for creating a new user
 */
export interface CreateUserData {
  name: string;
  email: string;
  emailVerified?: boolean;
  image?: string | null;
}

/**
 * Data for updating a user
 */
export interface UpdateUserData {
  name?: string;
  email?: string;
  emailVerified?: boolean;
  image?: string | null;
}

/**
 * User repository interface
 * Extends base repository with user-specific methods
 */
export interface IUserRepository extends IRepository<User> {
  /**
   * Find user by email
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Check if email exists
   */
  emailExists(email: string): Promise<boolean>;

  /**
   * Verify user's email
   */
  verifyEmail(userId: string): Promise<User>;

  /**
   * Find all verified users
   */
  findVerifiedUsers(): Promise<User[]>;
}

/**
 * Drizzle implementation of User Repository
 */
export class DrizzleUserRepository
  extends DrizzleBaseRepository<User>
  implements IUserRepository
{
  constructor(db: Database) {
    super(db, userTable);
  }

  /**
   * Create a new user
   */
  async create(data: CreateUserData): Promise<User> {
    const [newUser] = await this.db
      .insert(userTable)
      .values({
        id: crypto.randomUUID(),
        name: data.name,
        email: data.email,
        emailVerified: data.emailVerified ?? false,
        image: data.image ?? null,
      })
      .returning();

    return newUser as User;
  }

  /**
   * Update a user
   */
  async update(id: string, data: UpdateUserData): Promise<User> {
    const [updatedUser] = await this.db
      .update(userTable)
      .set(data)
      .where(eq(userTable.id, id))
      .returning();

    if (!updatedUser) {
      throw new Error(`User not found: ${id}`);
    }

    return updatedUser as User;
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    const [user] = await this.db
      .select()
      .from(userTable)
      .where(eq(userTable.email, email))
      .limit(1);

    return (user as User) || null;
  }

  /**
   * Check if email exists
   */
  async emailExists(email: string): Promise<boolean> {
    const user = await this.findByEmail(email);
    return user !== null;
  }

  /**
   * Verify user's email
   */
  async verifyEmail(userId: string): Promise<User> {
    return this.update(userId, { emailVerified: true });
  }

  /**
   * Find all verified users
   */
  async findVerifiedUsers(): Promise<User[]> {
    const users = await this.db
      .select()
      .from(userTable)
      .where(eq(userTable.emailVerified, true));

    return users as User[];
  }
}
