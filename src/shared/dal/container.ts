/**
 * Dependency Injection Container
 *
 * Central place to configure and access all repositories.
 * This makes it easy to swap implementations.
 */

import "server-only";

import { db } from "../db/client";
import type { ISessionRepository } from "./repositories/session-repository";
import { DrizzleSessionRepository } from "./repositories/session-repository";
import type { IUserRepository } from "./repositories/user-repository";
import { DrizzleUserRepository } from "./repositories/user-repository";

/**
 * Repository container interface
 * Add new repositories here as the app grows
 */
export interface IRepositoryContainer {
  users: IUserRepository;
  sessions: ISessionRepository;
}

/**
 * Create repository container with Drizzle implementations
 *
 * To swap to a different ORM/database:
 * 1. Create new implementations of IUserRepository, ISessionRepository, etc.
 * 2. Update this function to return those implementations
 * 3. No other code changes needed!
 */
export function createRepositoryContainer(): IRepositoryContainer {
  return {
    users: new DrizzleUserRepository(db),
    sessions: new DrizzleSessionRepository(db),
  };
}

/**
 * Singleton repository container
 * Use this in server-side code
 */
let repositoryContainer: IRepositoryContainer | null = null;

export function getRepositories(): IRepositoryContainer {
  if (!repositoryContainer) {
    repositoryContainer = createRepositoryContainer();
  }
  return repositoryContainer;
}

/**
 * Reset the container (useful for testing)
 */
export function resetRepositoryContainer(): void {
  repositoryContainer = null;
}
