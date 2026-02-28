import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  GLOBAL_DATABASE_URL: z.string().optional(),
  TENANT_DB_ADMIN_URL: z.string().optional(),
  TENANT_DB_HOST: z.string().optional(),
  TENANT_DB_USER: z.string().optional(),
  TENANT_DB_PASSWORD: z.string().optional(),
  TENANT_DATABASE_URL: z.string().optional(),
  JWT_SECRET: z.string().min(1),
  JWT_EXPIRES_IN: z.string().default("15m"),
  PORT: z.coerce.number().default(3000),
  CORS_ORIGIN: z.string().default("*"),
  GMAIL_CLIENT_ID: z.string().optional(),
  GMAIL_CLIENT_SECRET: z.string().optional(),
  GMAIL_REDIRECT_URI: z.string().optional(),
  GMAIL_REFRESH_TOKEN: z.string().optional(),
  GMAIL_SENDER_EMAIL: z.string().optional()
});

export const env = envSchema.parse(process.env);
