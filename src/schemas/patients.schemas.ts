import { z } from "zod";

export const patientCreateSchema = z.object({
  nom: z.string().min(1),
  prenom: z.string().min(1),
  telephone: z.string().optional(),
  tags: z.string().optional(),
  notes_internes: z.string().optional()
});

export const patientUpdateSchema = patientCreateSchema.partial();
