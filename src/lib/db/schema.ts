import {
  pgTable,
  pgEnum,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  numeric,
  jsonb,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

// ── Existing tables (unchanged) ──────────────────────

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

// ── New enums (tracking system) ──────────────────────

export const planTypeEnum = pgEnum("plan_type", [
  "FREE",
  "PRO",
  "TEAM",
  "ENTERPRISE",
]);

export const accountStatusEnum = pgEnum("account_status", [
  "ACTIVE",
  "SUSPENDED",
  "CANCELLED",
  "BLOCKED",
]);

export const cardTypeEnum = pgEnum("card_type", [
  "CREDIT",
  "DEBIT",
  "PREPAID",
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "CARD",
  "BANK_TRANSFER",
  "CRYPTO",
  "OTHER",
]);

export const laptopTypeEnum = pgEnum("laptop_type", ["DELL", "MAC"]);

export const userRoleEnum = pgEnum("user_role", ["ADMIN", "VIEWER"]);

// ── New tables (tracking system) ─────────────────────

export const accounts = pgTable("accounts", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  email: text("email").notNull(),
  planType: planTypeEnum("plan_type").notNull().default("FREE"),
  monthlyCost: numeric("monthly_cost", { precision: 10, scale: 2 })
    .notNull()
    .default("0"),
  status: accountStatusEnum("status").notNull().default("ACTIVE"),
  renewalDate: timestamp("renewal_date"),
  sharingEnabled: boolean("sharing_enabled").default(false).notNull(),
  sharedWith: text("shared_with"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const cards = pgTable("cards", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  cardholderName: text("cardholder_name").notNull(),
  last4: text("last4").notNull(),
  cardType: cardTypeEnum("card_type").notNull().default("CREDIT"),
  bankName: text("bank_name"),
  expiryMonth: integer("expiry_month"),
  expiryYear: integer("expiry_year"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const accountUsers = pgTable("account_users", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  accountId: text("account_id")
    .references(() => accounts.id, { onDelete: "cascade" })
    .notNull(),
  userName: text("user_name").notNull(),
  department: text("department"),
  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
});

export const payments = pgTable("payments", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  accountId: text("account_id")
    .references(() => accounts.id, { onDelete: "cascade" })
    .notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: paymentMethodEnum("payment_method")
    .notNull()
    .default("CARD"),
  cardId: text("card_id").references(() => cards.id, {
    onDelete: "set null",
  }),
  description: text("description"),
  paidAt: timestamp("paid_at").defaultNow().notNull(),
  refunded: boolean("refunded").default(false).notNull(),
  refundedAt: timestamp("refunded_at"),
  refundReason: text("refund_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const laptops = pgTable("laptops", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  assetTag: text("asset_tag").notNull().unique(),
  type: laptopTypeEnum("type").notNull(),
  brand: text("brand").notNull(),
  model: text("model").notNull(),
  serialNumber: text("serial_number"),
  specs: text("specs"),
  assignedTo: text("assigned_to"),
  department: text("department"),
  purchaseDate: timestamp("purchase_date"),
  warrantyEnd: timestamp("warranty_end"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const systemUsers = pgTable("system_users", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: userRoleEnum("role").notNull().default("VIEWER"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const auditLogs = pgTable("audit_logs", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  userId: text("user_id").references(() => systemUsers.id, {
    onDelete: "set null",
  }),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id"),
  details: jsonb("details"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Relations ────────────────────────────────────────

export const accountsRelations = relations(accounts, ({ many }) => ({
  users: many(accountUsers),
  payments: many(payments),
}));

export const accountUsersRelations = relations(accountUsers, ({ one }) => ({
  account: one(accounts, {
    fields: [accountUsers.accountId],
    references: [accounts.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  account: one(accounts, {
    fields: [payments.accountId],
    references: [accounts.id],
  }),
  card: one(cards, {
    fields: [payments.cardId],
    references: [cards.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(systemUsers, {
    fields: [auditLogs.userId],
    references: [systemUsers.id],
  }),
}));
