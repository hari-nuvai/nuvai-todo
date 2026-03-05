import { createAuditLog } from "@/lib/db/tracking-queries";

export async function audit(
  action: string,
  entityType: string,
  entityId?: string,
  details?: Record<string, unknown>
) {
  return createAuditLog({ action, entityType, entityId, details });
}
