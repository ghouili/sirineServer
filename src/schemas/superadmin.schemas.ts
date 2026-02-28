import { z } from "zod";

export const licenseCreateSchema = z.object({
  nom: z.string().min(1),
  type: z.enum(["bronze", "silver", "gold"]),
  billing_period: z.enum(["monthly", "yearly"]),
  duration_months: z.number().int().positive(),
  description: z.string().optional(),
  prix_mensuel: z.number().nonnegative(),
  features: z.record(z.unknown()),
  is_active: z.boolean().optional()
});

export const licenseUpdateSchema = licenseCreateSchema.partial();

export const promotionCreateSchema = z.object({
  license_id: z.string().min(1),
  discount_rate: z.number().nonnegative(),
  is_active: z.boolean().optional(),
  starts_at: z.coerce.date().optional(),
  ends_at: z.coerce.date().optional()
});

export const promotionUpdateSchema = promotionCreateSchema.partial();

export const tenantCreateSchema = z.object({
  nom: z.string().min(1),
  slug: z.string().min(1),
  logo_url: z.string().url().optional(),
  status: z.enum(["active", "suspended"]).optional()
});

export const tenantUpdateSchema = tenantCreateSchema.partial();

export const subscriptionCreateSchema = z.object({
  tenant_id: z.string().min(1),
  license_id: z.string().min(1),
  status: z.enum(["active", "suspended", "expired", "canceled"]),
  billing_period: z.enum(["monthly", "yearly"]),
  start_date: z.coerce.date(),
  end_date: z.coerce.date(),
  reference: z.string().optional(),
  siret: z.string().optional(),
  cabinet_nom: z.string().optional(),
  cabinet_adresse: z.string().optional(),
  cabinet_adresse_complete: z.string().optional(),
  specialite: z.string().optional(),
  owner_nom: z.string().optional(),
  owner_prenom: z.string().optional()
});

export const subscriptionUpdateSchema = subscriptionCreateSchema.partial();

export const subscriptionStatusSchema = z.object({
  status: z.enum(["active", "suspended", "expired", "canceled"])
});
