import type { PrismaClient } from "../../prisma/generated/tenant";

interface WorkingHourInput {
  praticien_id?: string;
  weekday?: number;
  start_time?: string;
  end_time?: string;
  is_active?: boolean;
}

export async function listWorkingHours(
  db: PrismaClient,
  tenantId: string,
  limit: number,
  offset: number
) {
  const [items, total] = await Promise.all([
    db.workingHour.findMany({
      where: { tenant_id: tenantId },
      skip: offset,
      take: limit,
      orderBy: [{ praticien_id: "asc" }, { weekday: "asc" }]
    }),
    db.workingHour.count({ where: { tenant_id: tenantId } })
  ]);

  return { items, total };
}

export function getWorkingHourById(
  db: PrismaClient,
  tenantId: string,
  id: string
) {
  return db.workingHour.findFirst({ where: { id, tenant_id: tenantId } });
}

export function createWorkingHour(
  db: PrismaClient,
  tenantId: string,
  data: WorkingHourInput
) {
  return db.workingHour.create({
    data: {
      tenant_id: tenantId,
      praticien_id: data.praticien_id ?? "",
      weekday: data.weekday ?? 0,
      start_time: data.start_time ?? "",
      end_time: data.end_time ?? "",
      is_active: data.is_active ?? true
    }
  });
}

export async function updateWorkingHour(
  db: PrismaClient,
  tenantId: string,
  id: string,
  data: WorkingHourInput
) {
  const result = await db.workingHour.updateMany({
    where: { id, tenant_id: tenantId },
    data
  });

  if (result.count === 0) {
    return null;
  }

  return getWorkingHourById(db, tenantId, id);
}

export async function deleteWorkingHour(
  db: PrismaClient,
  tenantId: string,
  id: string
) {
  const result = await db.workingHour.deleteMany({
    where: { id, tenant_id: tenantId }
  });

  return result.count > 0;
}
