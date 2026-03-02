import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";

export const modules = pgTable("modules", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  moduleId: integer("module_id")
    .references(() => modules.id, { onDelete: "cascade" })
    .notNull(),
  text: text("text").notNull(),
  phase: integer("phase").default(0).notNull(),
  assignee: text("assignee").default("Unassigned").notNull(),
  date: text("date").notNull(), // YYYY-MM-DD
  done: boolean("done").default(false).notNull(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
