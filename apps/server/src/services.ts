import { createAuth } from "@touch-grass/auth";
import { createDb } from "@touch-grass/db";

import { ENV } from "./env.server";

export const db = createDb(ENV);
export const auth = createAuth(ENV, db);
