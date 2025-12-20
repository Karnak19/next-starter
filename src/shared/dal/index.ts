/**
 * Data Access Layer (DAL)
 *
 * Export all DAL components for easy importing
 */

// Container
export {
  createRepositoryContainer,
  getRepositories,
  resetRepositoryContainer,
  type IRepositoryContainer,
} from "./container";

// Base types and interfaces
export type {
  BaseEntity,
  Filter,
  FilterOperator,
  IRepository,
  PaginatedResult,
  PaginationParams,
  QueryOptions,
} from "./types";

// Repository interfaces and implementations
export {
  DrizzleUserRepository,
  type CreateUserData,
  type IUserRepository,
  type UpdateUserData,
  type User,
} from "./repositories/user-repository";

export {
  DrizzleSessionRepository,
  type CreateSessionData,
  type ISessionRepository,
  type Session,
  type UpdateSessionData,
} from "./repositories/session-repository";

// Base implementation (for extending)
export { DrizzleBaseRepository } from "./drizzle-base-repository";
