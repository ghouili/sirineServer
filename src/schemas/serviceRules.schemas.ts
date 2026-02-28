import { z } from "zod";

export const serviceRuleCreateSchema = z.object({
  service_id: z.string().min(1),
  min_notice_hours: z.number().int().nonnegative().optional(),
  cancel_notice_hours: z.number().int().nonnegative().optional(),
  buffer_minutes: z.number().int().nonnegative().optional()
});

export const serviceRuleUpdateSchema = z.object({
  min_notice_hours: z.number().int().nonnegative().optional(),
  cancel_notice_hours: z.number().int().nonnegative().optional(),
  buffer_minutes: z.number().int().nonnegative().optional()
});
