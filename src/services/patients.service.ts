import { globalPrisma } from "../db/prisma";
import { hashPassword } from "../utils/password";

interface PatientInput {
  nom?: string;
  prenom?: string;
  email?: string;
  password?: string;
  telephone?: string | null;
  tags?: string | null;
  notes_internes?: string | null;
}

export async function listPatients(
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
      { telephone: { contains: q } },
      { email: { contains: q } }
    ];
  }

  if (tags) {
    where.tags = { contains: tags };
  }

  const [items, total] = await Promise.all([
    globalPrisma.patient.findMany({
      where,
      skip: offset,
      take: limit,
      orderBy: { created_at: "desc" }
    }),
    globalPrisma.patient.count({ where })
  ]);

  return { items, total };
}

export function getPatientById(tenantId: string, id: string) {
  return globalPrisma.patient.findFirst({ where: { id, tenant_id: tenantId } });
}

export async function createPatient(tenantId: string, data: PatientInput) {
  if (data.email) {
    const existing = await globalPrisma.patient.findUnique({
      where: { email: data.email }
    });
    if (existing) {
      return { error: "EMAIL_IN_USE" as const };
    }
  }

  const password_hash = data.password
    ? await hashPassword(data.password)
    : null;

  const patient = await globalPrisma.patient.create({
    data: {
      tenant_id: null,
      email: data.email ?? null,
      password_hash,
      nom: data.nom ?? "",
      prenom: data.prenom ?? "",
      telephone: data.telephone ?? null,
      tags: data.tags ?? null,
      notes_internes: data.notes_internes ?? null
    }
  });

  return { patient };
}

export async function updatePatient(
  tenantId: string,
  id: string,
  data: PatientInput
) {
  const existing = await globalPrisma.patient.findUnique({ where: { id } });
  if (!existing) {
    return { error: "NOT_FOUND" as const };
  }

  if (existing.tenant_id && existing.tenant_id !== tenantId) {
    return { error: "FORBIDDEN" as const };
  }

  const password_hash = data.password
    ? await hashPassword(data.password)
    : undefined;

  const patient = await globalPrisma.patient.update({
    where: { id },
    data: {
      tenant_id: existing.tenant_id ?? tenantId,
      email: data.email ?? existing.email,
      password_hash: password_hash ?? existing.password_hash,
      nom: data.nom ?? existing.nom,
      prenom: data.prenom ?? existing.prenom,
      telephone: data.telephone ?? existing.telephone,
      tags: data.tags ?? existing.tags,
      notes_internes: data.notes_internes ?? existing.notes_internes
    }
  });

  return { patient };
}

export async function deletePatient(tenantId: string, id: string) {
  const result = await globalPrisma.patient.deleteMany({
    where: { id, tenant_id: tenantId }
  });

  return result.count > 0;
}
