import type { Session } from "@touch-grass/auth";
import type { Database } from "@touch-grass/db";
import type { Identification, IdentifyInput } from "./domain";

export type Context = {
  session: Session | null;
  db: Database;
  cleanUnusedPhotos: (ids: string[]) => Promise<void>;
  identify: (input: IdentifyInput) => Promise<Identification>;
  sendTestPush: (userId: string) => Promise<number>;
  publicConfig: { google: boolean; ai: boolean; pushKey: string | null };
  rateLimitKey: string;
};
