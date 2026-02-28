import { Router } from "express";

import { auth } from "../middlewares/auth";
import { requireActiveSubscription } from "../middlewares/requireActiveSubscription";
import { requireRole } from "../middlewares/requireRole";
import { tenantResolver } from "../middlewares/tenantResolver";
import {
  workingHourCreateSchema,
  workingHourUpdateSchema
} from "../schemas/schedule.schemas";
import { getPaginationParams } from "../utils/pagination";
import {
  createWorkingHour,
  deleteWorkingHour,
  getWorkingHourById,
  listWorkingHours,
  updateWorkingHour
} from "../services/workingHours.service";

export const workingHoursRouter = Router();

workingHoursRouter.use(
  tenantResolver,
  requireActiveSubscription,
  auth,
  requireRole(["admin"])
);

workingHoursRouter.get("/working_hours", async (req, res, next) => {
  try {
    const { limit, offset } = getPaginationParams(
      req.query.limit as string,
      req.query.offset as string
    );

    const { items, total } = await listWorkingHours(req.tenantDb!, req.tenant!.id, limit, offset);

    res.status(200).json({ success: true, data: items, error: null, meta: { total, limit, offset } });
  } catch (error) {
    next(error as Error);
  }
});

workingHoursRouter.get("/working_hours/:id", async (req, res, next) => {
  try {
    const item = await getWorkingHourById(req.tenantDb!, req.tenant!.id, req.params.id);

    if (!item) {
      res.status(404).json({ success: false, data: null, error: { message: "NOT_FOUND" }, meta: null });
      return;
    }

    res.status(200).json({ success: true, data: item, error: null, meta: null });
  } catch (error) {
    next(error as Error);
  }
});

workingHoursRouter.post("/working_hours", async (req, res, next) => {
  try {
    const data = workingHourCreateSchema.parse(req.body);

    const user = await req.tenantDb!.user.findFirst({
      where: { id: data.praticien_id, tenant_id: req.tenant!.id }
    });

    if (!user) {
      res.status(404).json({ success: false, data: null, error: { message: "PRACTITIONER_NOT_FOUND" }, meta: null });
      return;
    }

    const item = await createWorkingHour(req.tenantDb!, req.tenant!.id, data);

    res.status(201).json({ success: true, data: item, error: null, meta: null });
  } catch (error) {
    next(error as Error);
  }
});

workingHoursRouter.patch("/working_hours/:id", async (req, res, next) => {
  try {
    const data = workingHourUpdateSchema.parse(req.body);

    if (data.praticien_id) {
      const user = await req.tenantDb!.user.findFirst({
        where: { id: data.praticien_id, tenant_id: req.tenant!.id }
      });

      if (!user) {
        res.status(404).json({ success: false, data: null, error: { message: "PRACTITIONER_NOT_FOUND" }, meta: null });
        return;
      }
    }

    const item = await updateWorkingHour(req.tenantDb!, req.tenant!.id, req.params.id, data);

    if (!item) {
      res.status(404).json({ success: false, data: null, error: { message: "NOT_FOUND" }, meta: null });
      return;
    }

    res.status(200).json({ success: true, data: item, error: null, meta: null });
  } catch (error) {
    next(error as Error);
  }
});

workingHoursRouter.delete("/working_hours/:id", async (req, res, next) => {
  try {
    const deleted = await deleteWorkingHour(req.tenantDb!, req.tenant!.id, req.params.id);

    if (!deleted) {
      res.status(404).json({ success: false, data: null, error: { message: "NOT_FOUND" }, meta: null });
      return;
    }

    res.status(204).send();
  } catch (error) {
    next(error as Error);
  }
});
