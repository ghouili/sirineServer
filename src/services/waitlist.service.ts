import { NotificationStatus, WaitlistStatus } from "../../prisma/generated/tenant";
import type { PrismaClient } from "../../prisma/generated/tenant";

interface WaitlistCreateInput {
  service_id: string;
  praticien_id?: string | null;
  patient_name: string;
  patient_phone?: string | null;
  patient_email?: string | null;
  preferred_from?: Date | null;
  preferred_to?: Date | null;
}

export async function listWaitlist(
  db: PrismaClient,
  tenantId: string,
  limit: number,
  offset: number
) {
  const [items, total] = await Promise.all([
    db.waitlistEntry.findMany({
      where: { tenant_id: tenantId },
      skip: offset,
      take: limit,
      orderBy: { created_at: "desc" }
    }),
    db.waitlistEntry.count({ where: { tenant_id: tenantId } })
  ]);

  return { items, total };
}

export function createWaitlistEntry(
  db: PrismaClient,
  tenantId: string,
  data: WaitlistCreateInput
) {
  return db.waitlistEntry.create({
    data: {
      tenant_id: tenantId,
      service_id: data.service_id,
      praticien_id: data.praticien_id ?? null,
      patient_name: data.patient_name,
      patient_phone: data.patient_phone ?? null,
      patient_email: data.patient_email ?? null,
      preferred_from: data.preferred_from ?? null,
      preferred_to: data.preferred_to ?? null,
      status: WaitlistStatus.open
    }
  });
}

export async function updateWaitlistStatus(
  db: PrismaClient,
  tenantId: string,
  id: string,
  status: WaitlistStatus
) {
  const result = await db.waitlistEntry.updateMany({
    where: { id, tenant_id: tenantId },
    data: { status }
  });

  if (result.count === 0) {
    return null;
  }

  return db.waitlistEntry.findFirst({ where: { id, tenant_id: tenantId } });
}

export async function notifyWaitlistOnCancellation(
  db: PrismaClient,
  tenantId: string,
  appointmentId: string
) {
  const appointment = await db.appointment.findFirst({
    where: { id: appointmentId, tenant_id: tenantId }
  });

  if (!appointment) {
    return null;
  }

  const waitlistEntry = await db.waitlistEntry.findFirst({
    where: {
      tenant_id: tenantId,
      status: WaitlistStatus.open,
      service_id: appointment.service_id,
      AND: [
        {
          OR: [
            { praticien_id: appointment.praticien_id },
            { praticien_id: null }
          ]
        },
        {
          OR: [
            { preferred_from: null, preferred_to: null },
            {
              preferred_from: { lte: appointment.date_heure_debut },
              preferred_to: { gte: appointment.date_heure_debut }
            }
          ]
        }
      ]
    },
    orderBy: { created_at: "asc" }
  });

  if (!waitlistEntry || !waitlistEntry.patient_email) {
    return null;
  }

  const notification = await db.notification.create({
    data: {
      tenant_id: tenantId,
      appointment_id: appointment.id,
      type: "waitlist",
      channel: "email",
      to_email: waitlistEntry.patient_email,
      subject: "Une place s'est liberee",
      payload: {
        appointment_id: appointment.id,
        service_id: appointment.service_id,
        praticien_id: appointment.praticien_id,
        start: appointment.date_heure_debut
      },
      status: NotificationStatus.queued
    }
  });

  await db.waitlistEntry.update({
    where: { id: waitlistEntry.id },
    data: { status: WaitlistStatus.notified }
  });

  return { notification, waitlistEntryId: waitlistEntry.id };
}
