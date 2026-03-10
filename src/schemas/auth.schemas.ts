import { z } from "zod";

// Shared login payload validation for auth endpoints.
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export const patientLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export const patientRegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  nom: z.string().min(1),
  prenom: z.string().min(1),
  telephone: z.string().optional()
});
