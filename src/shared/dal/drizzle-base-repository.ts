/**
 * Base Repository Implementation using Drizzle ORM
 *
 * This provides a concrete implementation of the repository pattern
 * using Drizzle. Swap this for another ORM by implementing IRepository.
 */

import { SQL, and, asc, count, desc, eq, sql } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import type { Database } from "../db/client";
import type {
  BaseEntity,
  Filter,
  IRepository,
  PaginatedResult,
  QueryOptions,
} from "./types";

/**
 * Abstract base repository for Drizzle ORM
 * Extend this class for specific entities
 */
export abstract class DrizzleBaseRepository<T extends BaseEntity>
  implements IRepository<T>
{
  constructor(
    protected readonly db: Database,
    protected readonly table: PgTable,
  ) {}

  /**
   * Convert filters to Drizzle WHERE conditions
   */
  protected buildWhereClause(filters?: Filter<T>[]): SQL | undefined {
    if (!filters || filters.length === 0) return undefined;

    const conditions = filters.map((filter) => {
      const column = this.table[filter.field as string];
      if (!column) {
        throw new Error(`Invalid field: ${String(filter.field)}`);
      }

      // Note: In a real implementation, you'd handle all operators
      // This is a simplified version
      switch (filter.operator) {
        case "eq":
          return eq(column, filter.value);
        default:
          throw new Error(`Unsupported operator: ${filter.operator}`);
      }
    });

    return and(...conditions);
  }

  /**
   * Find by ID
   */
  async findById(id: string): Promise<T | null> {
    const result = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.id, id))
      .limit(1);

    return (result[0] as T) || null;
  }

  /**
   * Find one entity
   */
  async findOne(options: QueryOptions<T>): Promise<T | null> {
    let query = this.db.select().from(this.table);

    const whereClause = this.buildWhereClause(options.filters);
    if (whereClause) {
      query = query.where(whereClause) as typeof query;
    }

    const result = await query.limit(1);
    return (result[0] as T) || null;
  }

  /**
   * Find many entities
   */
  async findMany(options?: QueryOptions<T>): Promise<T[]> {
    let query = this.db.select().from(this.table);

    if (options?.filters) {
      const whereClause = this.buildWhereClause(options.filters);
      if (whereClause) {
        query = query.where(whereClause) as typeof query;
      }
    }

    if (options?.orderBy) {
      const orderClauses = options.orderBy.map((order) => {
        const column = this.table[order.field as string];
        return order.direction === "asc" ? asc(column) : desc(column);
      });
      query = query.orderBy(...orderClauses) as typeof query;
    }

    if (options?.pagination) {
      query = query
        .limit(options.pagination.limit)
        .offset(options.pagination.offset) as typeof query;
    }

    const result = await query;
    return result as T[];
  }

  /**
   * Find with pagination
   */
  async findPaginated(options: QueryOptions<T>): Promise<PaginatedResult<T>> {
    const [items, totalCount] = await Promise.all([
      this.findMany(options),
      this.count(options),
    ]);

    return {
      items,
      total: totalCount,
      limit: options.pagination?.limit ?? 0,
      offset: options.pagination?.offset ?? 0,
    };
  }

  /**
   * Create entity
   * Note: Subclasses should implement this with proper typing
   */
  abstract create(data: Omit<T, keyof BaseEntity>): Promise<T>;

  /**
   * Update entity
   * Note: Subclasses should implement this with proper typing
   */
  abstract update(
    id: string,
    data: Partial<Omit<T, keyof BaseEntity>>,
  ): Promise<T>;

  /**
   * Delete entity
   */
  async delete(id: string): Promise<void> {
    await this.db.delete(this.table).where(eq(this.table.id, id));
  }

  /**
   * Count entities
   */
  async count(options?: QueryOptions<T>): Promise<number> {
    let query = this.db.select({ count: count() }).from(this.table);

    if (options?.filters) {
      const whereClause = this.buildWhereClause(options.filters);
      if (whereClause) {
        query = query.where(whereClause) as typeof query;
      }
    }

    const result = await query;
    return result[0]?.count ?? 0;
  }

  /**
   * Check if entity exists
   */
  async exists(id: string): Promise<boolean> {
    const result = await this.db
      .select({ id: this.table.id })
      .from(this.table)
      .where(eq(this.table.id, id))
      .limit(1);

    return result.length > 0;
  }
}
