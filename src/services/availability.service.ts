import { AppointmentStatus } from "../../prisma/generated/tenant";
import type { PrismaClient } from "../../prisma/generated/tenant";
import { addMinutes, endOfDay, getDateKey, getDaysBetween, parseTimeOnDate, startOfDay } from "../utils/time";
import { timeOverlap } from "../utils/timeOverlap";

interface Slot {
  start: Date;
  end: Date;
}

interface Interval {
  start: Date;
  end: Date;
}

function subtractIntervals(base: Interval[], exclusions: Interval[]): Interval[] {
  let result = [...base];

  for (const exclusion of exclusions) {
    result = result.flatMap((interval) => {
      if (!timeOverlap(interval.start, interval.end, exclusion.start, exclusion.end)) {
        return [interval];
      }

      const segments: Interval[] = [];

      if (interval.start < exclusion.start) {
        segments.push({ start: interval.start, end: exclusion.start });
      }

      if (interval.end > exclusion.end) {
        segments.push({ start: exclusion.end, end: interval.end });
      }

      return segments;
    });
  }

  return result;
}

export async function getAvailabilitySlots(
  db: PrismaClient,
  tenantId: string,
  serviceId: string,
  practitionerId: string,
  from: Date,
  to: Date
): Promise<Slot[]> {
  const service = await db.service.findFirst({
    where: { id: serviceId, tenant_id: tenantId }
  });

  if (!service) {
    return [];
  }

  const [rules, workingHours, breaks, timeOff, holidays, appointments] =
    await Promise.all([
      db.serviceRule.findFirst({
        where: { service_id: serviceId, tenant_id: tenantId }
      }),
      db.workingHour.findMany({
        where: { tenant_id: tenantId, praticien_id: practitionerId, is_active: true }
      }),
      db.break.findMany({
        where: { tenant_id: tenantId, praticien_id: practitionerId }
      }),
      db.timeOff.findMany({
        where: {
          tenant_id: tenantId,
          praticien_id: practitionerId,
          start_at: { lt: to },
          end_at: { gt: from }
        }
      }),
      db.holiday.findMany({
        where: {
          tenant_id: tenantId,
          date: { gte: startOfDay(from), lte: endOfDay(to) }
        }
      }),
      db.appointment.findMany({
        where: {
          tenant_id: tenantId,
          praticien_id: practitionerId,
          status: { not: AppointmentStatus.canceled },
          date_heure_debut: { lt: to },
          date_heure_fin: { gt: from }
        }
      })
    ]);

  const minNoticeHours = rules?.min_notice_hours ?? 0;
  const bufferMinutes = rules?.buffer_minutes ?? 0;
  const slotMinutes = service.duration_minutes;
  const stepMinutes = slotMinutes + bufferMinutes;
  const earliestAllowed = addMinutes(new Date(), minNoticeHours * 60);

  const holidaySet = new Set(holidays.map((holiday) => getDateKey(holiday.date)));
  const slots: Slot[] = [];

  for (const day of getDaysBetween(from, to)) {
    if (holidaySet.has(getDateKey(day))) {
      continue;
    }

    const weekday = day.getDay();
    const dayWorkingHours = workingHours.filter((wh) => wh.weekday === weekday);
    const dayBreaks = breaks.filter((brk) => brk.weekday === weekday);

    for (const wh of dayWorkingHours) {
      let intervalStart = parseTimeOnDate(day, wh.start_time);
      let intervalEnd = parseTimeOnDate(day, wh.end_time);

      if (intervalEnd <= intervalStart) {
        continue;
      }

      if (intervalEnd < from || intervalStart > to) {
        continue;
      }

      if (intervalStart < from) {
        intervalStart = new Date(from);
      }

      if (intervalEnd > to) {
        intervalEnd = new Date(to);
      }

      let availableIntervals: Interval[] = [{ start: intervalStart, end: intervalEnd }];

      const breakIntervals = dayBreaks.map((brk) => ({
        start: parseTimeOnDate(day, brk.start_time),
        end: parseTimeOnDate(day, brk.end_time)
      }));

      availableIntervals = subtractIntervals(availableIntervals, breakIntervals);

      const dayTimeOff = timeOff
        .filter((off) => timeOverlap(off.start_at, off.end_at, intervalStart, intervalEnd))
        .map((off) => ({
          start: off.start_at > intervalStart ? off.start_at : intervalStart,
          end: off.end_at < intervalEnd ? off.end_at : intervalEnd
        }));

      availableIntervals = subtractIntervals(availableIntervals, dayTimeOff);

      for (const interval of availableIntervals) {
        let cursor = new Date(interval.start);

        while (true) {
          const slotEnd = addMinutes(cursor, slotMinutes);
          const slotEndWithBuffer = addMinutes(cursor, slotMinutes + bufferMinutes);

          if (slotEndWithBuffer > interval.end) {
            break;
          }

          if (cursor >= earliestAllowed) {
            slots.push({ start: new Date(cursor), end: slotEnd });
          }

          cursor = addMinutes(cursor, stepMinutes);
        }
      }
    }
  }

  return slots.filter((slot) =>
    !appointments.some((appointment) =>
      timeOverlap(slot.start, addMinutes(slot.start, stepMinutes), appointment.date_heure_debut, appointment.date_heure_fin)
    )
  );
}
