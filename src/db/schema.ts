import { pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const examples = pgTable("examples", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  description: varchar("description", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type Example = typeof examples.$inferSelect;
export type NewExample = typeof examples.$inferInsert;
