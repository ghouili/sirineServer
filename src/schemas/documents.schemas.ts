import { z } from "zod";

export const documentCreateSchema = z.object({
  patient_id: z.string().min(1),
  type_document: z.string().min(1),
  visibility_level: z.enum(["private", "tenant", "public"])
});
