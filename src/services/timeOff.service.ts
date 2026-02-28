import type { PrismaClient } from "../../prisma/generated/tenant";

interface TimeOffInput {
  praticien_id?: string;
  start_at?: Date;
  end_at?: Date;
  reason?: string;
}

export async function listTimeOff(
  db: PrismaClient,
  tenantId: string,
  limit: number,
  offset: number
) {
  const [items, total] = await Promise.all([
    db.timeOff.findMany({
      where: { tenant_id: tenantId },
      skip: offset,
      take: limit,
      orderBy: { start_at: "desc" }
    }),
    db.timeOff.count({ where: { tenant_id: tenantId } })
  ]);

  return { items, total };
}

export function getTimeOffById(db: PrismaClient, tenantId: string, id: string) {
  return db.timeOff.findFirst({ where: { id, tenant_id: tenantId } });
}

export function createTimeOff(db: PrismaClient, tenantId: string, data: TimeOffInput) {
  return db.timeOff.create({
    data: {
      tenant_id: tenantId,
      praticien_id: data.praticien_id ?? "",
      start_at: data.start_at ?? new Date(),
      end_at: data.end_at ?? new Date(),
      reason: data.reason
    }
  });
}

export async function updateTimeOff(
  db: PrismaClient,
  tenantId: string,
  id: string,
  data: TimeOffInput
) {
  const result = await db.timeOff.updateMany({
    where: { id, tenant_id: tenantId },
    data
  });

  if (result.count === 0) {
    return null;
  }

  return getTimeOffById(db, tenantId, id);
}

export async function deleteTimeOff(db: PrismaClient, tenantId: string, id: string) {
  const result = await db.timeOff.deleteMany({
    where: { id, tenant_id: tenantId }
  });

  return result.count > 0;
}
