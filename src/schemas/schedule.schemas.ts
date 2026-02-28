import { z } from "zod";

export const workingHourCreateSchema = z.object({
  praticien_id: z.string().min(1),
  weekday: z.number().int().min(0).max(6),
  start_time: z.string().min(1),
  end_time: z.string().min(1),
  is_active: z.boolean().optional()
});

export const workingHourUpdateSchema = z.object({
  praticien_id: z.string().min(1).optional(),
  weekday: z.number().int().min(0).max(6).optional(),
  start_time: z.string().min(1).optional(),
  end_time: z.string().min(1).optional(),
  is_active: z.boolean().optional()
});

export const breakCreateSchema = z.object({
  praticien_id: z.string().min(1),
  weekday: z.number().int().min(0).max(6),
  start_time: z.string().min(1),
  end_time: z.string().min(1)
});

export const breakUpdateSchema = z.object({
  praticien_id: z.string().min(1).optional(),
  weekday: z.number().int().min(0).max(6).optional(),
  start_time: z.string().min(1).optional(),
  end_time: z.string().min(1).optional()
});

export const timeOffCreateSchema = z.object({
  praticien_id: z.string().min(1),
  start_at: z.coerce.date(),
  end_at: z.coerce.date(),
  reason: z.string().optional()
});

export const timeOffUpdateSchema = z.object({
  praticien_id: z.string().min(1).optional(),
  start_at: z.coerce.date().optional(),
  end_at: z.coerce.date().optional(),
  reason: z.string().optional()
});

export const holidayCreateSchema = z.object({
  date: z.coerce.date(),
  label: z.string().optional()
});

export const holidayUpdateSchema = z.object({
  date: z.coerce.date().optional(),
  label: z.string().optional()
});
