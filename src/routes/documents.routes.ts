import fs from "fs";
import path from "path";
import { Router } from "express";
import multer from "multer";

import { auth } from "../middlewares/auth";
import { requireActiveSubscription } from "../middlewares/requireActiveSubscription";
import { requireRole } from "../middlewares/requireRole";
import { tenantResolver } from "../middlewares/tenantResolver";
import { documentCreateSchema } from "../schemas/documents.schemas";
import {
  createDocument,
  createDocumentAccessLog,
  getDocumentById,
  listDocuments
} from "../services/documents.service";
import { getUploadPath } from "../utils/uploads";

export const documentsRouter = Router();

const upload = multer({ storage: multer.memoryStorage() });

documentsRouter.use(
  tenantResolver,
  requireActiveSubscription,
  auth,
  requireRole(["admin", "praticien", "assistant"])
);

documentsRouter.get("/documents", async (req, res, next) => {
  try {
    const items = await listDocuments(
      req.tenantDb!,
      req.tenant!.id,
      req.query.patient_id as string | undefined
    );

    res.status(200).json({ success: true, data: items, error: null, meta: null });
  } catch (error) {
    next(error as Error);
  }
});

documentsRouter.post("/documents", upload.single("file"), async (req, res, next) => {
  try {
    const data = documentCreateSchema.parse(req.body);

    if (!req.file) {
      res.status(400).json({ success: false, data: null, error: { message: "FILE_REQUIRED" }, meta: null });
      return;
    }

    const patient = await req.tenantDb!.patient.findFirst({
      where: { id: data.patient_id, tenant_id: req.tenant!.id }
    });

    if (!patient) {
      res.status(404).json({ success: false, data: null, error: { message: "PATIENT_NOT_FOUND" }, meta: null });
      return;
    }

    const { folder, filePath } = getUploadPath(
      req.tenant!.slug,
      data.patient_id,
      req.file.originalname
    );

    fs.mkdirSync(folder, { recursive: true });
    fs.writeFileSync(filePath, req.file.buffer);

    const document = await createDocument(req.tenantDb!, req.tenant!.id, {
      patient_id: data.patient_id,
      type_document: data.type_document,
      visibility_level: data.visibility_level,
      uploaded_by: req.user!.id,
      file_path: filePath
    });

    res.status(201).json({ success: true, data: document, error: null, meta: null });
  } catch (error) {
    next(error as Error);
  }
});

documentsRouter.get("/documents/:id", async (req, res, next) => {
  try {
    const document = await getDocumentById(req.tenantDb!, req.tenant!.id, req.params.id);

    if (!document) {
      res.status(404).json({ success: false, data: null, error: { message: "NOT_FOUND" }, meta: null });
      return;
    }

    await createDocumentAccessLog(req.tenantDb!, {
      tenant_id: req.tenant!.id,
      document_id: document.id,
      user_id: req.user?.id,
      patient_id: document.patient_id,
      action: "view",
      ip_address: req.ip
    });

    res.status(200).json({ success: true, data: document, error: null, meta: null });
  } catch (error) {
    next(error as Error);
  }
});

documentsRouter.get("/documents/:id/download", async (req, res, next) => {
  try {
    const document = await getDocumentById(req.tenantDb!, req.tenant!.id, req.params.id);

    if (!document) {
      res.status(404).json({ success: false, data: null, error: { message: "NOT_FOUND" }, meta: null });
      return;
    }

    await createDocumentAccessLog(req.tenantDb!, {
      tenant_id: req.tenant!.id,
      document_id: document.id,
      user_id: req.user?.id,
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
