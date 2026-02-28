import "express";
import type { PrismaClient as TenantPrismaClient } from "../../prisma/generated/tenant";

declare global {
  namespace Express {
    interface Request {
      tenant?: {
        id: string;
        slug: string;
      };
      tenantDbUrl?: string;
      tenantDb?: TenantPrismaClient;
      user?: {
        id: string;
        role: "super_admin" | "admin" | "praticien" | "assistant";
        tenantId?: string;
      };
    }
  }
}

export {};
