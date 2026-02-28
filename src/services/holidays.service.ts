import type { PrismaClient } from "../../prisma/generated/tenant";

interface HolidayInput {
  date?: Date;
  label?: string;
}

export async function listHolidays(
  db: PrismaClient,
  tenantId: string,
  limit: number,
  offset: number
) {
  const [items, total] = await Promise.all([
    db.holiday.findMany({
      where: { tenant_id: tenantId },
      skip: offset,
      take: limit,
      orderBy: { date: "asc" }
    }),
    db.holiday.count({ where: { tenant_id: tenantId } })
  ]);

  return { items, total };
}

export function getHolidayById(db: PrismaClient, tenantId: string, id: string) {
  return db.holiday.findFirst({ where: { id, tenant_id: tenantId } });
}

export function createHoliday(db: PrismaClient, tenantId: string, data: HolidayInput) {
  return db.holiday.create({
    data: {
      tenant_id: tenantId,
      date: data.date ?? new Date(),
      label: data.label
    }
  });
}

export async function updateHoliday(
  db: PrismaClient,
  tenantId: string,
  id: string,
  data: HolidayInput
) {
  const result = await db.holiday.updateMany({
    where: { id, tenant_id: tenantId },
    data
  });

  if (result.count === 0) {
    return null;
  }

  return getHolidayById(db, tenantId, id);
}

export async function deleteHoliday(db: PrismaClient, tenantId: string, id: string) {
  const result = await db.holiday.deleteMany({
    where: { id, tenant_id: tenantId }
  });

  return result.count > 0;
}
