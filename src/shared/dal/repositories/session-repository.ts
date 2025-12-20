/**
 * Session Repository
 *
 * Domain-specific data access for Sessions
 */

import { and, eq, gt } from "drizzle-orm";
import type { Database } from "../../db/client";
import { session as sessionTable } from "../../db/schema";
import { DrizzleBaseRepository } from "../drizzle-base-repository";
import type { BaseEntity, IRepository } from "../types";

/**
 * Session entity type
 */
export interface Session extends BaseEntity {
  expiresAt: Date;
  token: string;
  ipAddress: string | null;
  userAgent: string | null;
  userId: string;
}

/**
 * Data for creating a new session
 */
export interface CreateSessionData {
  expiresAt: Date;
  token: string;
  userId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Data for updating a session
 */
export interface UpdateSessionData {
  expiresAt?: Date;
  token?: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Session repository interface
 * Extends base repository with session-specific methods
 */
export interface ISessionRepository extends IRepository<Session> {
  /**
   * Find session by token
   */
  findByToken(token: string): Promise<Session | null>;

  /**
   * Find all sessions for a user
   */
  findByUserId(userId: string): Promise<Session[]>;

  /**
   * Find active sessions for a user
   */
  findActiveSessionsByUserId(userId: string): Promise<Session[]>;

  /**
   * Delete all sessions for a user
   */
  deleteByUserId(userId: string): Promise<void>;

  /**
   * Delete expired sessions
   */
  deleteExpired(): Promise<number>;

  /**
   * Check if session is expired
   */
  isExpired(sessionId: string): Promise<boolean>;
}

/**
 * Drizzle implementation of Session Repository
 */
export class DrizzleSessionRepository
  extends DrizzleBaseRepository<Session>
  implements ISessionRepository
{
  constructor(db: Database) {
    super(db, sessionTable);
  }

  /**
   * Create a new session
   */
  async create(data: CreateSessionData): Promise<Session> {
    const [newSession] = await this.db
      .insert(sessionTable)
      .values({
        id: crypto.randomUUID(),
        expiresAt: data.expiresAt,
        token: data.token,
        userId: data.userId,
        ipAddress: data.ipAddress ?? null,
        userAgent: data.userAgent ?? null,
      })
      .returning();

    return newSession as Session;
  }

  /**
   * Update a session
   */
  async update(id: string, data: UpdateSessionData): Promise<Session> {
    const [updatedSession] = await this.db
      .update(sessionTable)
      .set(data)
      .where(eq(sessionTable.id, id))
      .returning();

    if (!updatedSession) {
      throw new Error(`Session not found: ${id}`);
    }

    return updatedSession as Session;
  }

  /**
   * Find session by token
   */
  async findByToken(token: string): Promise<Session | null> {
    const [session] = await this.db
      .select()
      .from(sessionTable)
      .where(eq(sessionTable.token, token))
      .limit(1);

    return (session as Session) || null;
  }

  /**
   * Find all sessions for a user
   */
  async findByUserId(userId: string): Promise<Session[]> {
    const sessions = await this.db
      .select()
      .from(sessionTable)
      .where(eq(sessionTable.userId, userId));

    return sessions as Session[];
  }

  /**
   * Find active (non-expired) sessions for a user
   */
  async findActiveSessionsByUserId(userId: string): Promise<Session[]> {
    const now = new Date();
    const sessions = await this.db
      .select()
      .from(sessionTable)
      .where(
        and(eq(sessionTable.userId, userId), gt(sessionTable.expiresAt, now)),
      );

    return sessions as Session[];
  }

  /**
   * Delete all sessions for a user
   */
  async deleteByUserId(userId: string): Promise<void> {
    await this.db.delete(sessionTable).where(eq(sessionTable.userId, userId));
  }

  /**
   * Delete expired sessions
   */
  async deleteExpired(): Promise<number> {
    const now = new Date();
    const result = await this.db
      .delete(sessionTable)
      .where(gt(now, sessionTable.expiresAt))
      .returning({ id: sessionTable.id });

    return result.length;
  }

  /**
   * Check if session is expired
   */
  async isExpired(sessionId: string): Promise<boolean> {
    const session = await this.findById(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    return session.expiresAt < new Date();
  }
}
