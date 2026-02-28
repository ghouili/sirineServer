import { Router } from "express";

import { auth } from "../middlewares/auth";
import { requireActiveSubscription } from "../middlewares/requireActiveSubscription";
import { requireRole } from "../middlewares/requireRole";
import { tenantResolver } from "../middlewares/tenantResolver";
import {
  serviceCreateSchema,
  servicePractitionerSchema,
  serviceUpdateSchema
} from "../schemas/services.schemas";
import { getPaginationParams } from "../utils/pagination";
import {
  createService,
  deleteService,
  getServiceById,
  listServices,
  updateService
} from "../services/services.service";
import {
  assignPractitionerToService,
  removePractitionerFromService
} from "../services/servicePractitioners.service";

export const servicesRouter = Router();

servicesRouter.use(tenantResolver, requireActiveSubscription, auth, requireRole(["admin"]));

servicesRouter.get("/services", async (req, res, next) => {
  try {
    const { limit, offset } = getPaginationParams(
      req.query.limit as string,
      req.query.offset as string
    );

    const { items, total } = await listServices(req.tenantDb!, req.tenant!.id, limit, offset);

    res.status(200).json({ success: true, data: items, error: null, meta: { total, limit, offset } });
  } catch (error) {
    next(error as Error);
  }
});

servicesRouter.get("/services/:id", async (req, res, next) => {
  try {
    const service = await getServiceById(req.tenantDb!, req.tenant!.id, req.params.id);

    if (!service) {
      res.status(404).json({ success: false, data: null, error: { message: "NOT_FOUND" }, meta: null });
      return;
    }

    res.status(200).json({ success: true, data: service, error: null, meta: null });
  } catch (error) {
    next(error as Error);
  }
});

servicesRouter.post("/services", async (req, res, next) => {
  try {
    const data = serviceCreateSchema.parse(req.body);
    const service = await createService(req.tenantDb!, req.tenant!.id, data);

    res.status(201).json({ success: true, data: service, error: null, meta: null });
  } catch (error) {
    next(error as Error);
  }
});

servicesRouter.patch("/services/:id", async (req, res, next) => {
  try {
    const data = serviceUpdateSchema.parse(req.body);
    const service = await updateService(req.tenantDb!, req.tenant!.id, req.params.id, data);

    if (!service) {
      res.status(404).json({ success: false, data: null, error: { message: "NOT_FOUND" }, meta: null });
      return;
    }

    res.status(200).json({ success: true, data: service, error: null, meta: null });
  } catch (error) {
    next(error as Error);
  }
});

servicesRouter.delete("/services/:id", async (req, res, next) => {
  try {
    const deleted = await deleteService(req.tenantDb!, req.tenant!.id, req.params.id);

    if (!deleted) {
      res.status(404).json({ success: false, data: null, error: { message: "NOT_FOUND" }, meta: null });
      return;
    }

    res.status(204).send();
  } catch (error) {
    next(error as Error);
  }
});

servicesRouter.post("/services/:id/practitioners", async (req, res, next) => {
  try {
    const data = servicePractitionerSchema.parse(req.body);
    const assignment = await assignPractitionerToService(
      req.tenantDb!,
      req.tenant!.id,
      req.params.id,
      data.user_id
    );

    if (!assignment) {
      res.status(404).json({ success: false, data: null, error: { message: "NOT_FOUND" }, meta: null });
      return;
    }

    res.status(201).json({ success: true, data: assignment, error: null, meta: null });
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") {
      res.status(409).json({ success: false, data: null, error: { message: "ALREADY_ASSIGNED" }, meta: null });
      return;
    }
    next(error as Error);
  }
});

servicesRouter.delete("/services/:id/practitioners/:userId", async (req, res, next) => {
  try {
    const deleted = await removePractitionerFromService(
      req.tenantDb!,
      req.tenant!.id,
      req.params.id,
      req.params.userId
    );

    if (!deleted) {
      res.status(404).json({ success: false, data: null, error: { message: "NOT_FOUND" }, meta: null });
      return;
    }

    res.status(204).send();
  } catch (error) {
    next(error as Error);
  }
});
