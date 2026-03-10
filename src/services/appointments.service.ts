import { AppointmentStatus } from "../../prisma/generated/tenant";
import type { PrismaClient } from "../../prisma/generated/tenant";
import { globalPrisma } from "../db/prisma";
import { addMinutes } from "../utils/time";
import { timeOverlap } from "../utils/timeOverlap";

interface AppointmentCreateInput {
  patient_id: string;
  praticien_id: string;
  service_id: string;
  date_heure_debut: Date;
  status?: AppointmentStatus;
}

interface AppointmentUpdateInput {
  status?: AppointmentStatus;
  no_show_probability_score?: number;
  ia_recommandation?: string;
}

export async function listAppointments(
  db: PrismaClient,
  tenantId: string,
  limit: number,
  offset: number,
  practitionerId?: string
) {
  const where: Record<string, unknown> = { tenant_id: tenantId };

  if (practitionerId) {
    where.praticien_id = practitionerId;
  }

  const [items, total] = await Promise.all([
    db.appointment.findMany({
      where,
      skip: offset,
      take: limit,
      orderBy: { date_heure_debut: "asc" }
    }),
    db.appointment.count({ where })
  ]);

  return { items, total };
}

export function getAppointmentById(
  db: PrismaClient,
  tenantId: string,
  id: string
) {
  return db.appointment.findFirst({ where: { id, tenant_id: tenantId } });
}

export async function createAppointment(
  db: PrismaClient,
  tenantId: string,
  data: AppointmentCreateInput
) {
  const patient = await globalPrisma.patient.findFirst({
    where: { id: data.patient_id, tenant_id: tenantId }
  });

  if (!patient) {
    return { error: "RELATED_NOT_FOUND" as const };
  }

  return db.$transaction(async (tx) => {
    const [practitioner, service, rules] = await Promise.all([
      tx.user.findFirst({ where: { id: data.praticien_id, tenant_id: tenantId } }),
      tx.service.findFirst({ where: { id: data.service_id, tenant_id: tenantId } }),
      tx.serviceRule.findFirst({ where: { service_id: data.service_id, tenant_id: tenantId } })
    ]);

    if (!practitioner || !service) {
      return { error: "RELATED_NOT_FOUND" as const };
    }

    const bufferMinutes = rules?.buffer_minutes ?? 0;
    const durationMinutes = service.duration_minutes;

    const start = new Date(data.date_heure_debut);
    const end = addMinutes(start, durationMinutes);
    const endWithBuffer = addMinutes(start, durationMinutes + bufferMinutes);

    const overlapping = await tx.appointment.findFirst({
      where: {
        tenant_id: tenantId,
        praticien_id: data.praticien_id,
        status: { not: AppointmentStatus.canceled },
        date_heure_debut: { lt: endWithBuffer },
        date_heure_fin: { gt: start }
      }
    });

    if (overlapping || !timeOverlap(start, endWithBuffer, start, endWithBuffer)) {
      return { error: "OVERLAP" as const };
    }

    const created = await tx.appointment.create({
      data: {
        tenant_id: tenantId,
        patient_id: data.patient_id,
        praticien_id: data.praticien_id,
        service_id: data.service_id,
        date_heure_debut: start,
        date_heure_fin: end,
        status: data.status ?? AppointmentStatus.scheduled
      }
    });

    return { data: created };
  });
}

export async function updateAppointment(
  db: PrismaClient,
  tenantId: string,
  id: string,
  data: AppointmentUpdateInput
) {
  const result = await db.appointment.updateMany({
    where: { id, tenant_id: tenantId },
    data
  });

  if (result.count === 0) {
    return null;
  }

  return getAppointmentById(db, tenantId, id);
}

export async function cancelAppointment(db: PrismaClient, tenantId: string, id: string) {
  const result = await db.appointment.updateMany({
    where: { id, tenant_id: tenantId },
    data: { status: AppointmentStatus.canceled }
  });

  if (result.count === 0) {
    return null;
  }

  return getAppointmentById(db, tenantId, id);
}

export async function deleteAppointment(db: PrismaClient, tenantId: string, id: string) {
  const result = await db.appointment.deleteMany({
    where: { id, tenant_id: tenantId }
  });

  return result.count > 0;
}
