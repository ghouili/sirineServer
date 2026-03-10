import { Router } from "express";

import { env } from "../config/env";
import { getTenantPrisma, globalPrisma } from "../db/prisma";

export const healthRouter = Router();

healthRouter.get("/health", async (_req, res) => {
  const checks: Record<string, unknown> = {};

  try {
    // Global database connectivity and tenant registry visibility.
    await globalPrisma.$queryRaw`SELECT 1`;
    const registryCount = await globalPrisma.tenantDatabase.count();
    checks.globalDb = { ok: true, tenantRegistryCount: registryCount };
  } catch (error) {
    checks.globalDb = { ok: false, error: (error as Error).message };
  }

  try {
    // Validate every tenant database registered in the global registry.
    const registries = await globalPrisma.tenantDatabase.findMany();

    if (registries.length === 0) {
      checks.tenantDb = { ok: false, error: "NO_TENANT_DATABASES" };
    } else {
      const results = [] as Array<{ tenant_id: string; ok: boolean; error?: string }>;

      for (const registry of registries) {
        try {
          // Open the tenant database and verify connectivity.
          const tenantDb = getTenantPrisma(registry.db_url);
          await tenantDb.$queryRaw`SELECT 1`;
          results.push({ tenant_id: registry.tenant_id, ok: true });
        } catch (error) {
          results.push({
            tenant_id: registry.tenant_id,
            ok: false,
            error: (error as Error).message
          });
        }
      }

      checks.tenantDb = {
        ok: results.every((result) => result.ok),
        total: results.length,
        failed: results.filter((result) => !result.ok).length,
        results
      };
    }
  } catch (error) {
    checks.tenantDb = { ok: false, error: (error as Error).message };
  }

  // Global status is healthy only if global DB and all tenant DB checks pass.
  const ok = Boolean(
    (checks.globalDb as { ok?: boolean })?.ok &&
      (checks.tenantDb as { ok?: boolean })?.ok
  );

  res.status(ok ? 200 : 503).json({
    success: ok,
    data: { status: ok ? "ok" : "degraded", checks },
    error: ok ? null : { message: "HEALTH_CHECK_FAILED" },
    meta: null
  });
});
