import {
  pgTable,
  text,
  timestamp,
  boolean,
  doublePrecision,
  jsonb,
  uuid,
  index,
  integer,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

export const photo = pgTable(
  "photo",
  {
    id: uuid().primaryKey(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    key: text().notNull().unique(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("photo_user_idx").on(t.userId)],
);

export const discovery = pgTable(
  "discovery",
  {
    id: uuid().primaryKey(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    photoIds: jsonb().$type<string[]>().notNull(),
    commonName: text().notNull(),
    scientificName: text().notNull().default(""),
    identification: jsonb().$type<unknown>(),
    nickname: text().notNull().default(""),
    notes: text().notNull().default(""),
    place: text().notNull().default(""),
    latitude: doublePrecision(),
    longitude: doublePrecision(),
    stage: text().notNull().default("Not sure"),
    followed: boolean().notNull().default(false),
    observedAt: timestamp({ withTimezone: true }).notNull(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("discovery_user_idx").on(t.userId)],
);

export const visit = pgTable(
  "visit",
  {
    id: uuid().primaryKey(),
    discoveryId: uuid()
      .notNull()
      .references(() => discovery.id, { onDelete: "cascade" }),
    photoIds: jsonb().$type<string[]>().notNull(),
    notes: text().notNull().default(""),
    stage: text().notNull(),
    observedAt: timestamp({ withTimezone: true }).notNull(),
  },
  (t) => [index("visit_discovery_idx").on(t.discoveryId)],
);

export const pushSubscription = pgTable(
  "push_subscription",
  {
    endpoint: text().primaryKey(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    p256dh: text().notNull(),
    auth: text().notNull(),
    lastSentAt: timestamp({ withTimezone: true }),
  },
  (t) => [index("push_user_idx").on(t.userId)],
);

export const rateLimit = pgTable("rate_limit", {
  key: text().primaryKey(),
  count: integer().notNull().default(1),
  expiresAt: timestamp({ withTimezone: true }).notNull(),
});
