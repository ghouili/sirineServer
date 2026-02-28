import { z } from "zod";

export const userCreateSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  nom: z.string().min(1),
  prenom: z.string().min(1),
  role: z.enum(["admin", "praticien", "assistant"]),
  is_active: z.boolean().optional()
});

export const userUpdateSchema = z.object({
  email: z.string().email().optional(),
  nom: z.string().min(1).optional(),
  prenom: z.string().min(1).optional(),
  role: z.enum(["admin", "praticien", "assistant"]).optional(),
  is_active: z.boolean().optional()
});

export const userResetPasswordSchema = z.object({
  password: z.string().min(6)
});
