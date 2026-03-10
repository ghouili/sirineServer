import { NextFunction, Request, Response } from "express";

import { getTenantDbUrl, getTenantPrisma, globalPrisma } from "../db/prisma";

export async function tenantResolver(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Tenant slug is the primary lookup key for multi-tenant routing.
    const slug = req.header("X-Tenant-Slug");

    if (!slug) {
      res.status(400).json({
        success: false,
        data: null,
        error: { message: "TENANT_SLUG_REQUIRED" },
        meta: null
      });
      return;
    }

    // Tenants are stored in the global database.
    const tenant = await globalPrisma.tenant.findUnique({ where: { slug } });

    if (!tenant) {
      res.status(404).json({
        success: false,
        data: null,
        error: { message: "TENANT_NOT_FOUND" },
        meta: null
      });
      return;
    }

    if (tenant.status === "suspended") {
      res.status(403).json({
        success: false,
        data: null,
        error: { message: "TENANT_SUSPENDED" },
        meta: null
      });
      return;
    }

    // Resolve tenant DB connection details from the global registry.
    const tenantDbUrl = await getTenantDbUrl(tenant.id);
    req.tenant = { id: tenant.id, slug: tenant.slug };
    req.tenantDbUrl = tenantDbUrl;
    // Attach a tenant-scoped Prisma client for downstream handlers.
    req.tenantDb = getTenantPrisma(tenantDbUrl);
    next();
  } catch (error) {
    next(error as Error);
  }
}
