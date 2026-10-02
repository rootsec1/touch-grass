import type { Session } from "@touch-grass/auth";
import type { Database } from "@touch-grass/db";

export type Context = {
  session: Session | null;
  db: Database;
};
