import type { PrismaClient } from "../../prisma/generated/tenant";

interface PatientInput {
  nom?: string;
  prenom?: string;
  telephone?: string | null;
  tags?: string | null;
  notes_internes?: string | null;
}

export async function listPatients(
  db: PrismaClient,
  tenantId: string,
  limit: number,
  offset: number,
  q?: string,
  tags?: string
) {
  const where: Record<string, unknown> = { tenant_id: tenantId };

  if (q) {
    where.OR = [
      { nom: { contains: q } },
      { prenom: { contains: q } },
      { telephone: { contains: q } }
    ];
  }

  if (tags) {
    where.tags = { contains: tags };
  }

  const [items, total] = await Promise.all([
    db.patient.findMany({
      where,
      skip: offset,
      take: limit,
      orderBy: { created_at: "desc" }
    }),
    db.patient.count({ where })
  ]);

  return { items, total };
}

export function getPatientById(db: PrismaClient, tenantId: string, id: string) {
  return db.patient.findFirst({ where: { id, tenant_id: tenantId } });
}

export function createPatient(db: PrismaClient, tenantId: string, data: PatientInput) {
  return db.patient.create({
    data: {
      tenant_id: tenantId,
      nom: data.nom ?? "",
      prenom: data.prenom ?? "",
      telephone: data.telephone ?? null,
      tags: data.tags ?? null,
      notes_internes: data.notes_internes ?? null
    }
  });
}

export async function updatePatient(
  db: PrismaClient,
  tenantId: string,
  id: string,
  data: PatientInput
) {
  const result = await db.patient.updateMany({
    where: { id, tenant_id: tenantId },
    data
  });

  if (result.count === 0) {
    return null;
  }

  return getPatientById(db, tenantId, id);
}

export async function deletePatient(db: PrismaClient, tenantId: string, id: string) {
  const result = await db.patient.deleteMany({
    where: { id, tenant_id: tenantId }
  });

  return result.count > 0;
}
