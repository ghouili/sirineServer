import { z } from "zod";

export const appointmentCreateSchema = z.object({
  patient_id: z.string().min(1),
  praticien_id: z.string().min(1),
  service_id: z.string().min(1),
  date_heure_debut: z.coerce.date(),
  status: z.enum(["scheduled", "confirmed", "completed", "canceled", "no_show"]).optional()
});

export const appointmentUpdateSchema = z.object({
  status: z.enum(["scheduled", "confirmed", "completed", "canceled", "no_show"]).optional(),
  no_show_probability_score: z.number().min(0).max(1).optional(),
  ia_recommandation: z.string().optional()
});
