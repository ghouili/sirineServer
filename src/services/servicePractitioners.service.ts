import type { PrismaClient } from "../../prisma/generated/tenant";

export async function assignPractitionerToService(
  db: PrismaClient,
  tenantId: string,
  serviceId: string,
  userId: string
) {
  const [service, user] = await Promise.all([
    db.service.findFirst({ where: { id: serviceId, tenant_id: tenantId } }),
    db.user.findFirst({ where: { id: userId, tenant_id: tenantId } })
  ]);

  if (!service || !user) {
    return null;
  }

  await db.servicePractitioner.create({
    data: { service_id: serviceId, user_id: userId }
  });

  return { serviceId, userId };
}

export async function removePractitionerFromService(
  db: PrismaClient,
  tenantId: string,
  serviceId: string,
  userId: string
) {
  const service = await db.service.findFirst({
    where: { id: serviceId, tenant_id: tenantId }
  });

  if (!service) {
    return false;
  }

  const result = await db.servicePractitioner.deleteMany({
    where: { service_id: serviceId, user_id: userId }
  });

  return result.count > 0;
}
