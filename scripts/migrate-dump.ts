/**
 * Migrate data from old Prisma dump into current Drizzle schema via Neon HTTP.
 * Run: npx tsx scripts/migrate-dump.ts
 */
import fs from "fs";
import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL!);

function parseCopy(dump: string, tableName: string): Record<string, string>[] {
  const regex = new RegExp(
    `COPY public\\."${tableName}" \\(([^)]+)\\) FROM stdin;\n([\\s\\S]*?)\n\\\\\\.`,
    "m"
  );
  const match = dump.match(regex);
  if (!match) return [];
  const columns = match[1].split(",").map((c) => c.trim().replace(/"/g, ""));
  const rows: Record<string, string>[] = [];
  for (const line of match[2].split("\n")) {
    if (!line.trim()) continue;
    const values = line.split("\t");
    const row: Record<string, string> = {};
    columns.forEach((col, i) => { row[col] = values[i] === "\\N" ? "" : values[i]; });
    rows.push(row);
  }
  return rows;
}

function mapPlan(old: string): string {
  return ({ PRO_20: "PRO", TEAM_100: "TEAM", ENTERPRISE_200: "ENTERPRISE" } as Record<string, string>)[old] || "FREE";
}
function mapStatus(old: string): string {
  return ({ ACTIVE: "ACTIVE", BLOCKED: "BLOCKED", SUSPENDED: "SUSPENDED", EXPIRED: "CANCELLED" } as Record<string, string>)[old] || "ACTIVE";
}
function mapPaymentMethod(old: string): string {
  return ({ CARD: "CARD", UPI: "OTHER", BANK_TRANSFER: "BANK_TRANSFER", OTHER: "OTHER" } as Record<string, string>)[old] || "CARD";
}

async function retry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  for (let i = 0; i < attempts; i++) {
    try { return await fn(); }
    catch (e) {
      if (i === attempts - 1) throw e;
      console.log(`  retry ${i + 1}...`);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  throw new Error("unreachable");
}

async function main() {
  const dump = fs.readFileSync("/Users/hari-nuvai/db_snapshot_2026-03-05.sql", "utf-8");

  // Warm up the connection
  console.log("Warming up Neon connection...");
  await retry(() => sql`SELECT 1`);
  console.log("Connected!\n");

  // 1. Cards
  const oldCards = parseCopy(dump, "Card");
  console.log(`Cards: ${oldCards.length}`);
  for (const c of oldCards) {
    await retry(() => sql`INSERT INTO cards (id, cardholder_name, last4, card_type, bank_name, created_at)
      VALUES (${c.id}, ${c.cardHolderName}, ${c.lastFourDigits}, ${c.cardType === "DEBIT" ? "DEBIT" : "CREDIT"}, ${c.bankName || null}, ${c.createdAt})
      ON CONFLICT (id) DO NOTHING`);
  }
  console.log("  done");

  // 2. Accounts
  const oldAccounts = parseCopy(dump, "Account");
  console.log(`Accounts: ${oldAccounts.length}`);
  for (const a of oldAccounts) {
    await retry(() => sql`INSERT INTO accounts (id, email, plan_type, monthly_cost, status, sharing_enabled, created_at, updated_at)
      VALUES (${a.id}, ${a.email}, ${mapPlan(a.planType)}, ${a.monthlyCost}, ${mapStatus(a.status)}, ${a.isShared === "t"}, ${a.createdAt}, ${a.updatedAt})
      ON CONFLICT (id) DO NOTHING`);
  }
  console.log("  done");

  // 3. Account Users
  const oldAccountUsers = parseCopy(dump, "AccountUser");
  console.log(`Account Users: ${oldAccountUsers.length}`);
  for (const u of oldAccountUsers) {
    if (u.isActive !== "t") continue;
    await retry(() => sql`INSERT INTO account_users (id, account_id, user_name, department, assigned_at)
      VALUES (${u.id}, ${u.accountId}, ${u.userName}, ${u.department || null}, ${u.assignedAt})
      ON CONFLICT (id) DO NOTHING`);
  }
  console.log("  done");

  // 4. Payments
  const oldPayments = parseCopy(dump, "Payment");
  console.log(`Payments: ${oldPayments.length}`);
  for (const p of oldPayments) {
    await retry(() => sql`INSERT INTO payments (id, account_id, amount, payment_method, description, paid_at, refunded, refunded_at, refund_reason, created_at)
      VALUES (${p.id}, ${p.accountId}, ${p.amount}, ${mapPaymentMethod(p.paymentMethod)}, ${p.note || null}, ${p.paymentDate}, ${p.isRefunded === "t"}, ${p.refundedAt || null}, ${p.refundNote || null}, ${p.createdAt})
      ON CONFLICT (id) DO NOTHING`);
  }
  console.log("  done");

  // 5. Laptops
  const oldLaptops = parseCopy(dump, "Laptop");
  console.log(`Laptops: ${oldLaptops.length}`);
  for (const l of oldLaptops) {
    const brand = l.type === "MAC" ? "Apple" : "Dell";
    const model = l.spec || l.type;
    const specs = [l.ram, l.storage, l.spec].filter(Boolean).join(", ");
    await retry(() => sql`INSERT INTO laptops (id, asset_tag, type, brand, model, specs, assigned_to, notes, created_at, updated_at)
      VALUES (${l.id}, ${l.assetTag}, ${l.type}, ${brand}, ${model}, ${specs || null}, ${l.assignedTo || null}, ${l.notes || null}, ${l.createdAt}, ${l.updatedAt})
      ON CONFLICT (id) DO NOTHING`);
  }
  console.log("  done");

  // 6. Audit Logs
  const oldLogs = parseCopy(dump, "AuditLog");
  console.log(`Audit Logs: ${oldLogs.length}`);
  for (const log of oldLogs) {
    if (!log.action || !log.entityType) continue;
    let details: string | null = null;
    if (log.details) {
      try { JSON.parse(log.details); details = log.details; } catch { details = JSON.stringify({ raw: log.details }); }
    }
    await retry(() => sql`INSERT INTO audit_logs (id, action, entity_type, entity_id, details, created_at)
      VALUES (${log.id}, ${log.action}, ${log.entityType}, ${log.entityId || null}, ${details}::jsonb, ${log.createdAt})
      ON CONFLICT (id) DO NOTHING`);
  }
  console.log("  done");

  // 7. Users -> system_users
  const oldUsers = parseCopy(dump, "User");
  console.log(`Users: ${oldUsers.length}`);
  for (const u of oldUsers) {
    const role = u.role === "SUPER_ADMIN" || u.role === "ADMIN" ? "ADMIN" : "VIEWER";
    await retry(() => sql`INSERT INTO system_users (id, name, email, role, created_at)
      VALUES (${u.id}, ${u.name}, ${u.email}, ${role}, ${u.createdAt})
      ON CONFLICT (id) DO NOTHING`);
  }
  console.log("  done");

  console.log("\nAll data migrated successfully!");
}

main().catch((e) => { console.error("Migration failed:", e.message); process.exit(1); });
