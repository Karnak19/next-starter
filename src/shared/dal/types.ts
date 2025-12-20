/**
 * Data Access Layer - Core Types
 *
 * Generic types and interfaces for the repository pattern
 */

/**
 * Base entity with common fields
 */
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  limit: number;
  offset: number;
}

/**
 * Paginated result
 */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Filter operators for queries
 */
export type FilterOperator = "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "in" | "notIn" | "like" | "ilike";

/**
 * Generic filter for querying
 */
export interface Filter<T> {
  field: keyof T;
  operator: FilterOperator;
  value: unknown;
}

/**
 * Query options
 */
export interface QueryOptions<T> {
  filters?: Filter<T>[];
  orderBy?: {
    field: keyof T;
    direction: "asc" | "desc";
  }[];
  pagination?: PaginationParams;
}

/**
 * Base repository interface
 * All repositories should implement this interface
 */
export interface IRepository<T extends BaseEntity> {
  /**
   * Find entity by ID
   */
  findById(id: string): Promise<T | null>;

  /**
   * Find single entity by filters
   */
  findOne(options: QueryOptions<T>): Promise<T | null>;

  /**
   * Find multiple entities
   */
  findMany(options?: QueryOptions<T>): Promise<T[]>;

  /**
   * Find with pagination
   */
  findPaginated(options: QueryOptions<T>): Promise<PaginatedResult<T>>;

  /**
   * Create new entity
   */
  create(data: Omit<T, keyof BaseEntity>): Promise<T>;

  /**
   * Update entity by ID
   */
  update(id: string, data: Partial<Omit<T, keyof BaseEntity>>): Promise<T>;

  /**
   * Delete entity by ID
   */
  delete(id: string): Promise<void>;

  /**
   * Count entities matching filters
   */
  count(options?: QueryOptions<T>): Promise<number>;

  /**
   * Check if entity exists
   */
  exists(id: string): Promise<boolean>;
}
