import type { PrismaClient } from "../../prisma/generated/tenant";

interface BreakInput {
  praticien_id?: string;
  weekday?: number;
  start_time?: string;
  end_time?: string;
}

export async function listBreaks(
  db: PrismaClient,
  tenantId: string,
  limit: number,
  offset: number
) {
  const [items, total] = await Promise.all([
    db.break.findMany({
      where: { tenant_id: tenantId },
      skip: offset,
      take: limit,
      orderBy: [{ praticien_id: "asc" }, { weekday: "asc" }]
    }),
    db.break.count({ where: { tenant_id: tenantId } })
  ]);

  return { items, total };
}

export function getBreakById(db: PrismaClient, tenantId: string, id: string) {
  return db.break.findFirst({ where: { id, tenant_id: tenantId } });
}

export function createBreak(db: PrismaClient, tenantId: string, data: BreakInput) {
  return db.break.create({
    data: {
      tenant_id: tenantId,
      praticien_id: data.praticien_id ?? "",
      weekday: data.weekday ?? 0,
      start_time: data.start_time ?? "",
      end_time: data.end_time ?? ""
    }
  });
}

export async function updateBreak(
  db: PrismaClient,
  tenantId: string,
  id: string,
  data: BreakInput
) {
  const result = await db.break.updateMany({
    where: { id, tenant_id: tenantId },
    data
  });

  if (result.count === 0) {
    return null;
  }

  return getBreakById(db, tenantId, id);
}

export async function deleteBreak(db: PrismaClient, tenantId: string, id: string) {
  const result = await db.break.deleteMany({
    where: { id, tenant_id: tenantId }
  });

  return result.count > 0;
}
