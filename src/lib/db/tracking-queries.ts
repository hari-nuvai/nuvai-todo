import { eq, desc, sql, and, type SQL } from "drizzle-orm";
import { db, withRetry } from "./index";
import {
  accounts,
  cards,
  accountUsers,
  payments,
  laptops,
  auditLogs,
  systemUsers,
} from "./schema";

// ── Accounts ─────────────────────────────────────────

export async function listAccounts(filters?: {
  status?: string;
  planType?: string;
}) {
  return withRetry(async () => {
    const conditions: SQL[] = [];
    if (filters?.status) conditions.push(eq(accounts.status, filters.status as any));
    if (filters?.planType) conditions.push(eq(accounts.planType, filters.planType as any));
    return db
      .select()
      .from(accounts)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(accounts.createdAt));
  });
}

export async function getAccountById(id: string) {
  const [account] = await db
    .select()
    .from(accounts)
    .where(eq(accounts.id, id))
    .limit(1);
  return account ?? null;
}

export async function createAccount(data: {
  email: string;
  planType?: "FREE" | "PRO" | "TEAM" | "ENTERPRISE";
  monthlyCost?: string;
  status?: "ACTIVE" | "SUSPENDED" | "CANCELLED" | "BLOCKED";
  renewalDate?: Date;
  sharingEnabled?: boolean;
  sharedWith?: string;
  notes?: string;
}) {
  const [account] = await db.insert(accounts).values(data).returning();
  return account;
}

export async function updateAccount(
  id: string,
  data: Partial<{
    email: string;
    planType: "FREE" | "PRO" | "TEAM" | "ENTERPRISE";
    monthlyCost: string;
    status: "ACTIVE" | "SUSPENDED" | "CANCELLED" | "BLOCKED";
    renewalDate: Date;
    sharingEnabled: boolean;
    sharedWith: string;
    notes: string;
  }>
) {
  const [updated] = await db
    .update(accounts)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(accounts.id, id))
    .returning();
  return updated ?? null;
}

export async function deleteAccount(id: string) {
  const [deleted] = await db
    .delete(accounts)
    .where(eq(accounts.id, id))
    .returning();
  return deleted ?? null;
}

// ── Cards ────────────────────────────────────────────

export async function listCards() {
  return withRetry(() => db.select().from(cards).orderBy(desc(cards.createdAt)));
}

export async function createCard(data: {
  cardholderName: string;
  last4: string;
  cardType?: "CREDIT" | "DEBIT" | "PREPAID";
  bankName?: string;
  expiryMonth?: number;
  expiryYear?: number;
}) {
  const [card] = await db.insert(cards).values(data).returning();
  return card;
}

export async function deleteCard(id: string) {
  const [deleted] = await db.delete(cards).where(eq(cards.id, id)).returning();
  return deleted ?? null;
}

// ── Account Users ────────────────────────────────────

export async function getAccountUsers(accountId: string) {
  return db
    .select()
    .from(accountUsers)
    .where(eq(accountUsers.accountId, accountId))
    .orderBy(accountUsers.assignedAt);
}

export async function assignUser(data: {
  accountId: string;
  userName: string;
  department?: string;
}) {
  const [user] = await db.insert(accountUsers).values(data).returning();
  return user;
}

export async function removeUser(id: string) {
  const [deleted] = await db
    .delete(accountUsers)
    .where(eq(accountUsers.id, id))
    .returning();
  return deleted ?? null;
}

// ── Payments ─────────────────────────────────────────

export async function listPayments(filters?: {
  accountId?: string;
  refunded?: boolean;
}) {
  return withRetry(async () => {
    const conditions: SQL[] = [];
    if (filters?.accountId) conditions.push(eq(payments.accountId, filters.accountId));
    if (filters?.refunded !== undefined) conditions.push(eq(payments.refunded, filters.refunded));
    return db
      .select({
        id: payments.id,
        accountId: payments.accountId,
        accountEmail: accounts.email,
        amount: payments.amount,
        paymentMethod: payments.paymentMethod,
        cardId: payments.cardId,
        description: payments.description,
        paidAt: payments.paidAt,
        refunded: payments.refunded,
        refundedAt: payments.refundedAt,
        refundReason: payments.refundReason,
        createdAt: payments.createdAt,
      })
      .from(payments)
      .leftJoin(accounts, eq(payments.accountId, accounts.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(payments.paidAt));
  });
}

export async function createPayment(data: {
  accountId: string;
  amount: string;
  paymentMethod?: "CARD" | "BANK_TRANSFER" | "CRYPTO" | "OTHER";
  cardId?: string;
  description?: string;
}) {
  const [payment] = await db.insert(payments).values(data).returning();
  return payment;
}

export async function refundPayment(id: string, reason?: string) {
  const [updated] = await db
    .update(payments)
    .set({
      refunded: true,
      refundedAt: new Date(),
      refundReason: reason ?? null,
    })
    .where(eq(payments.id, id))
    .returning();
  return updated ?? null;
}

// ── Laptops ──────────────────────────────────────────

export async function listLaptops(filters?: {
  type?: string;
  assignedTo?: string;
}) {
  return withRetry(async () => {
    const conditions: SQL[] = [];
    if (filters?.type) conditions.push(eq(laptops.type, filters.type as any));
    if (filters?.assignedTo) conditions.push(eq(laptops.assignedTo, filters.assignedTo));
    return db
      .select()
      .from(laptops)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(laptops.createdAt));
  });
}

export async function getLaptopById(id: string) {
  const [laptop] = await db
    .select()
    .from(laptops)
    .where(eq(laptops.id, id))
    .limit(1);
  return laptop ?? null;
}

export async function createLaptop(data: {
  assetTag: string;
  type: "DELL" | "MAC";
  brand: string;
  model: string;
  serialNumber?: string;
  specs?: string;
  assignedTo?: string;
  department?: string;
  purchaseDate?: Date;
  warrantyEnd?: Date;
  notes?: string;
}) {
  const [laptop] = await db.insert(laptops).values(data).returning();
  return laptop;
}

export async function updateLaptop(
  id: string,
  data: Partial<{
    assetTag: string;
    type: "DELL" | "MAC";
    brand: string;
    model: string;
    serialNumber: string;
    specs: string;
    assignedTo: string;
    department: string;
    purchaseDate: Date;
    warrantyEnd: Date;
    notes: string;
  }>
) {
  const [updated] = await db
    .update(laptops)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(laptops.id, id))
    .returning();
  return updated ?? null;
}

// ── Audit Logs ───────────────────────────────────────

export async function listAuditLogs(filters?: {
  entityType?: string;
  userId?: string;
}) {
  return withRetry(async () => {
    const conditions: SQL[] = [];
    if (filters?.entityType) conditions.push(eq(auditLogs.entityType, filters.entityType));
    if (filters?.userId) conditions.push(eq(auditLogs.userId, filters.userId));
    return db
      .select({
        id: auditLogs.id,
        userId: auditLogs.userId,
        userName: systemUsers.name,
        action: auditLogs.action,
        entityType: auditLogs.entityType,
        entityId: auditLogs.entityId,
        details: auditLogs.details,
        createdAt: auditLogs.createdAt,
      })
      .from(auditLogs)
      .leftJoin(systemUsers, eq(auditLogs.userId, systemUsers.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(auditLogs.createdAt));
  });
}

export async function createAuditLog(data: {
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: Record<string, unknown>;
}) {
  const [log] = await db.insert(auditLogs).values(data).returning();
  return log;
}

// ── Dashboard KPIs ───────────────────────────────────

export async function getTrackingDashboard() {
  return withRetry(async () => {
  const [accountStats] = await db
    .select({
      total: sql<number>`count(*)::int`,
      active: sql<number>`count(*) filter (where ${accounts.status} = 'ACTIVE')::int`,
      blocked: sql<number>`count(*) filter (where ${accounts.status} = 'BLOCKED')::int`,
      monthlySpend: sql<string>`coalesce(sum(${accounts.monthlyCost}::numeric), 0)::text`,
    })
    .from(accounts);

  const [paymentStats] = await db
    .select({
      totalPayments: sql<number>`count(*)::int`,
      totalAmount: sql<string>`coalesce(sum(${payments.amount}::numeric), 0)::text`,
      refunds: sql<number>`count(*) filter (where ${payments.refunded} = true)::int`,
      refundAmount: sql<string>`coalesce(sum(case when ${payments.refunded} = true then ${payments.amount}::numeric else 0 end), 0)::text`,
    })
    .from(payments);

  const [laptopStats] = await db
    .select({
      total: sql<number>`count(*)::int`,
      dell: sql<number>`count(*) filter (where ${laptops.type} = 'DELL')::int`,
      mac: sql<number>`count(*) filter (where ${laptops.type} = 'MAC')::int`,
      assigned: sql<number>`count(*) filter (where ${laptops.assignedTo} is not null)::int`,
    })
    .from(laptops);

  return {
    accounts: accountStats,
    payments: paymentStats,
    laptops: laptopStats,
  };
  });
}

// ── Export Data ──────────────────────────────────────

export async function getExportData(type: string) {
  switch (type) {
    case "accounts":
      return db.select().from(accounts).orderBy(accounts.email);
    case "payments":
      return db
        .select({
          id: payments.id,
          accountEmail: accounts.email,
          amount: payments.amount,
          paymentMethod: payments.paymentMethod,
          description: payments.description,
          paidAt: payments.paidAt,
          refunded: payments.refunded,
        })
        .from(payments)
        .leftJoin(accounts, eq(payments.accountId, accounts.id))
        .orderBy(desc(payments.paidAt));
    case "laptops":
      return db.select().from(laptops).orderBy(laptops.assetTag);
    case "audit-logs":
      return db
        .select()
        .from(auditLogs)
        .orderBy(desc(auditLogs.createdAt));
    default:
      return [];
  }
}
