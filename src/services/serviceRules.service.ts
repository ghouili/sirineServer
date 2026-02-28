import type { PrismaClient } from "../../prisma/generated/tenant";

interface ServiceRuleInput {
  service_id?: string;
  min_notice_hours?: number;
  cancel_notice_hours?: number;
  buffer_minutes?: number;
}

export async function listServiceRules(
  db: PrismaClient,
  tenantId: string,
  limit: number,
  offset: number
) {
  const [items, total] = await Promise.all([
    db.serviceRule.findMany({
      where: { tenant_id: tenantId },
      skip: offset,
      take: limit,
      orderBy: { service_id: "asc" }
    }),
    db.serviceRule.count({ where: { tenant_id: tenantId } })
  ]);

  return { items, total };
}

export function getServiceRuleById(
  db: PrismaClient,
  tenantId: string,
  id: string
) {
  return db.serviceRule.findFirst({ where: { id, tenant_id: tenantId } });
}

export function createServiceRule(
  db: PrismaClient,
  tenantId: string,
  data: ServiceRuleInput
) {
  return db.serviceRule.create({
    data: {
      tenant_id: tenantId,
      service_id: data.service_id ?? "",
      min_notice_hours: data.min_notice_hours ?? 0,
      cancel_notice_hours: data.cancel_notice_hours ?? 0,
      buffer_minutes: data.buffer_minutes ?? 0
    }
  });
}

export async function updateServiceRule(
  db: PrismaClient,
  tenantId: string,
  id: string,
  data: ServiceRuleInput
) {
  const result = await db.serviceRule.updateMany({
    where: { id, tenant_id: tenantId },
    data
  });

  if (result.count === 0) {
    return null;
  }

  return getServiceRuleById(db, tenantId, id);
}

export async function deleteServiceRule(
  db: PrismaClient,
  tenantId: string,
  id: string
) {
  const result = await db.serviceRule.deleteMany({
    where: { id, tenant_id: tenantId }
  });

  return result.count > 0;
}
