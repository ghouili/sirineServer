import { z } from "zod";

export const waitlistCreateSchema = z.object({
  service_id: z.string().min(1),
  praticien_id: z.string().min(1).optional(),
  patient_name: z.string().min(1),
  patient_phone: z.string().optional(),
  patient_email: z.string().email().optional(),
  preferred_from: z.coerce.date().optional(),
  preferred_to: z.coerce.date().optional()
});

export const waitlistUpdateSchema = z.object({
  status: z.enum(["open", "notified", "closed"]).optional()
});
