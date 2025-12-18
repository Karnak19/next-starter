import { SQL } from "bun";
import { drizzle } from "drizzle-orm/bun-sql";
import {
  account,
  accountRelations,
  session,
  sessionRelations,
  user,
  userRelations,
  verification,
} from "./schema";

/**
 * PostgreSQL client using Bun's native SQL module
 * Crazy fast 🚀
 */
const client = new SQL(process.env.DATABASE_URL ?? "");

/**
 * Drizzle ORM instance with schema
 */
export const db = drizzle({
  client,
  schema: {
    user,
    session,
    account,
    verification,
    userRelations,
    sessionRelations,
    accountRelations,
  },
});

export type Database = typeof db;
