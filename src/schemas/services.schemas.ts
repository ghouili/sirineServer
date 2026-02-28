import { z } from "zod";

export const serviceCreateSchema = z.object({
  nom: z.string().min(1),
  duration_minutes: z.number().int().positive(),
  prix: z.number().nonnegative()
});

export const serviceUpdateSchema = serviceCreateSchema.partial();

export const servicePractitionerSchema = z.object({
  user_id: z.string().min(1)
});
