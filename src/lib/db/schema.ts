import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

export const modules = pgTable("modules", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const stages = pgTable("stages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  order: integer("order").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const moduleStages = pgTable(
  "module_stages",
  {
    id: serial("id").primaryKey(),
    moduleId: integer("module_id")
      .references(() => modules.id, { onDelete: "cascade" })
      .notNull(),
    stageId: integer("stage_id")
      .references(() => stages.id, { onDelete: "cascade" })
      .notNull(),
    owner: text("owner"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [unique().on(t.moduleId, t.stageId)]
);

export const stageModuleOwners = pgTable(
  "stage_module_owners",
  {
    id: serial("id").primaryKey(),
    moduleStageId: integer("module_stage_id")
      .references(() => moduleStages.id, { onDelete: "cascade" })
      .notNull(),
    ownerName: text("owner_name").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [unique().on(t.moduleStageId, t.ownerName)]
);

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  moduleId: integer("module_id")
    .references(() => modules.id, { onDelete: "cascade" })
    .notNull(),
  stageId: integer("stage_id").references(() => stages.id, {
    onDelete: "set null",
  }),
  text: text("text").notNull(),
  phase: integer("phase").default(0).notNull(),
  assignee: text("assignee").default("Unassigned").notNull(),
  date: text("date").notNull(), // YYYY-MM-DD
  done: boolean("done").default(false).notNull(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
