import type { PrismaClient } from "../../prisma/generated/tenant";

interface ServiceInput {
  nom?: string;
  duration_minutes?: number;
  prix?: number;
}

export async function listServices(
  db: PrismaClient,
  tenantId: string,
  limit: number,
  offset: number
) {
  const [items, total] = await Promise.all([
    db.service.findMany({
      where: { tenant_id: tenantId },
      skip: offset,
      take: limit,
      orderBy: { nom: "asc" }
    }),
    db.service.count({ where: { tenant_id: tenantId } })
  ]);

  return { items, total };
}

export function getServiceById(db: PrismaClient, tenantId: string, id: string) {
  return db.service.findFirst({ where: { id, tenant_id: tenantId } });
}

export function createService(db: PrismaClient, tenantId: string, data: ServiceInput) {
  return db.service.create({
    data: {
      tenant_id: tenantId,
      nom: data.nom ?? "",
      duration_minutes: data.duration_minutes ?? 0,
      prix: data.prix ?? 0
    }
  });
}

export async function updateService(
  db: PrismaClient,
  tenantId: string,
  id: string,
  data: ServiceInput
) {
  const result = await db.service.updateMany({
    where: { id, tenant_id: tenantId },
    data
  });

  if (result.count === 0) {
    return null;
  }

  return getServiceById(db, tenantId, id);
}

export async function deleteService(db: PrismaClient, tenantId: string, id: string) {
  const result = await db.service.deleteMany({
    where: { id, tenant_id: tenantId }
  });

  return result.count > 0;
}
