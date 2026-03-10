import { Router } from "express";

import { auth } from "../middlewares/auth";
import { requireActiveSubscription } from "../middlewares/requireActiveSubscription";
import { requireRole } from "../middlewares/requireRole";
import { tenantResolver } from "../middlewares/tenantResolver";
import {
  patientCreateSchema,
  patientUpdateSchema
} from "../schemas/patients.schemas";
import { getPaginationParams } from "../utils/pagination";
import {
  createPatient,
  deletePatient,
  getPatientById,
  listPatients,
  updatePatient
} from "../services/patients.service";

export const patientsRouter = Router();

patientsRouter.use(tenantResolver, requireActiveSubscription, auth, requireRole(["admin"]));

patientsRouter.get("/patients", async (req, res, next) => {
  try {
    const { limit, offset } = getPaginationParams(
      req.query.limit as string,
      req.query.offset as string
    );

    const { items, total } = await listPatients(
      req.tenant!.id,
      limit,
      offset,
      req.query.q as string | undefined,
      req.query.tags as string | undefined
    );

    res.status(200).json({ success: true, data: items, error: null, meta: { total, limit, offset } });
  } catch (error) {
    next(error as Error);
  }
});

patientsRouter.get("/patients/:id", async (req, res, next) => {
  try {
    const patient = await getPatientById(req.tenant!.id, req.params.id);

    if (!patient) {
      res.status(404).json({ success: false, data: null, error: { message: "NOT_FOUND" }, meta: null });
      return;
    }

    res.status(200).json({ success: true, data: patient, error: null, meta: null });
  } catch (error) {
    next(error as Error);
  }
});

patientsRouter.post("/patients", async (req, res, next) => {
  try {
    const data = patientCreateSchema.parse(req.body);
    const result = await createPatient(req.tenant!.id, data);

    if (result.error === "EMAIL_IN_USE") {
      res.status(409).json({
        success: false,
        data: null,
        error: { message: "EMAIL_IN_USE" },
        meta: null
      });
      return;
    }

    res.status(201).json({ success: true, data: result.patient, error: null, meta: null });
  } catch (error) {
    next(error as Error);
  }
});

patientsRouter.patch("/patients/:id", async (req, res, next) => {
  try {
    const data = patientUpdateSchema.parse(req.body);
    const result = await updatePatient(req.tenant!.id, req.params.id, data);

    if (result.error === "NOT_FOUND") {
      res.status(404).json({ success: false, data: null, error: { message: "NOT_FOUND" }, meta: null });
      return;
    }

    if (result.error === "FORBIDDEN") {
      res.status(403).json({ success: false, data: null, error: { message: "FORBIDDEN" }, meta: null });
      return;
    }

    res.status(200).json({ success: true, data: result.patient, error: null, meta: null });
  } catch (error) {
    next(error as Error);
  }
});

patientsRouter.delete("/patients/:id", async (req, res, next) => {
  try {
    const deleted = await deletePatient(req.tenant!.id, req.params.id);

    if (!deleted) {
      res.status(404).json({ success: false, data: null, error: { message: "NOT_FOUND" }, meta: null });
      return;
    }

    res.status(204).send();
  } catch (error) {
    next(error as Error);
  }
});
