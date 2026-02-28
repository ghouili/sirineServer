import fs from "fs";
import path from "path";
import { Router } from "express";

import { createDocumentAccessLog } from "../services/documents.service";
import { getTenantDbUrl, getTenantPrisma, globalPrisma } from "../db/prisma";

export const publicRouter = Router();

publicRouter.get("/public/documents/:id", async (req, res, next) => {
  try {
    const patientId = req.query.patient_id as string | undefined;
    const tenantSlug = req.query.tenant_slug as string | undefined;

    if (!patientId || !tenantSlug) {
      res.status(400).json({
        success: false,
        data: null,
        error: { message: "PUBLIC_ACCESS_REQUIRED_PARAMS" },
        meta: null
      });
      return;
    }

    const tenant = await globalPrisma.tenant.findUnique({ where: { slug: tenantSlug } });

    if (!tenant) {
      res.status(404).json({ success: false, data: null, error: { message: "TENANT_NOT_FOUND" }, meta: null });
      return;
    }

    const tenantDbUrl = await getTenantDbUrl(tenant.id);
    const tenantDb = getTenantPrisma(tenantDbUrl);

    const document = await tenantDb.document.findFirst({
      where: { id: req.params.id, tenant_id: tenant.id }
    });

    if (!document) {
      res.status(404).json({ success: false, data: null, error: { message: "NOT_FOUND" }, meta: null });
      return;
    }

    if (document.visibility_level !== "public" || document.patient_id !== patientId) {
      res.status(403).json({ success: false, data: null, error: { message: "FORBIDDEN" }, meta: null });
      return;
    }

    await createDocumentAccessLog(tenantDb, {
      tenant_id: document.tenant_id,
      document_id: document.id,
      patient_id: document.patient_id,
      action: "download",
      ip_address: req.ip
    });

    const resolved = path.resolve(document.file_path);

    if (!fs.existsSync(resolved)) {
      res.status(404).json({ success: false, data: null, error: { message: "FILE_NOT_FOUND" }, meta: null });
      return;
    }

    res.download(resolved);
  } catch (error) {
    next(error as Error);
  }
});
