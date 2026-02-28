import { z } from "zod";

export const availabilityQuerySchema = z.object({
  service_id: z.string().min(1),
  praticien_id: z.string().min(1),
  from: z.coerce.date(),
  to: z.coerce.date()
});
