import {
  doublePrecision,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  clerkUserId: varchar("clerk_user_id", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 120 }).notNull(),
  cnpj: varchar("cnpj", { length: 14 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  contractor: varchar("contractor", { length: 200 }),
  technicalManager: varchar("technical_manager", { length: 200 }),
  originalDxf: text("original_dxf"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const hydraulicNodes = pgTable("hydraulic_nodes", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  code: varchar("code", { length: 50 }).notNull(),
  type: varchar("type", { length: 20 }).notNull().default("PV"),
  x: doublePrecision("x").notNull(),
  y: doublePrecision("y").notNull(),
  invertElevation: doublePrecision("invert_elevation").notNull(),
  terrainElevation: doublePrecision("terrain_elevation"),
  angle: doublePrecision("angle"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const segments = pgTable("segments", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  code: varchar("code", { length: 50 }).notNull(),
  upstreamNodeId: uuid("upstream_node_id")
    .notNull()
    .references(() => hydraulicNodes.id),
  downstreamNodeId: uuid("downstream_node_id")
    .notNull()
    .references(() => hydraulicNodes.id),
  length: doublePrecision("length").notNull(),
  slope: doublePrecision("slope").notNull(),
  upstreamInvert: doublePrecision("upstream_invert").notNull(),
  downstreamInvert: doublePrecision("downstream_invert").notNull(),
  pavementType: varchar("pavement_type", { length: 100 }),
  diameter: doublePrecision("diameter"),
  material: varchar("material", { length: 50 }),
  manning: doublePrecision("manning"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type Example = typeof examples.$inferSelect;
export type NewExample = typeof examples.$inferInsert;
export type DbProject = typeof projects.$inferSelect;
export type DbHydraulicNode = typeof hydraulicNodes.$inferSelect;
export type DbSegment = typeof segments.$inferSelect;
