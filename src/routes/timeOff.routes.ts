import { Router } from "express";

import { auth } from "../middlewares/auth";
import { requireActiveSubscription } from "../middlewares/requireActiveSubscription";
import { requireRole } from "../middlewares/requireRole";
import { tenantResolver } from "../middlewares/tenantResolver";
import { timeOffCreateSchema, timeOffUpdateSchema } from "../schemas/schedule.schemas";
import { getPaginationParams } from "../utils/pagination";
import {
  createTimeOff,
  deleteTimeOff,
  getTimeOffById,
  listTimeOff,
  updateTimeOff
} from "../services/timeOff.service";

export const timeOffRouter = Router();

timeOffRouter.use(tenantResolver, requireActiveSubscription, auth, requireRole(["admin"]));

timeOffRouter.get("/time_off", async (req, res, next) => {
  try {
    const { limit, offset } = getPaginationParams(
      req.query.limit as string,
      req.query.offset as string
    );

    const { items, total } = await listTimeOff(req.tenantDb!, req.tenant!.id, limit, offset);

    res.status(200).json({ success: true, data: items, error: null, meta: { total, limit, offset } });
  } catch (error) {
    next(error as Error);
  }
});

timeOffRouter.get("/time_off/:id", async (req, res, next) => {
  try {
    const item = await getTimeOffById(req.tenantDb!, req.tenant!.id, req.params.id);

    if (!item) {
      res.status(404).json({ success: false, data: null, error: { message: "NOT_FOUND" }, meta: null });
      return;
    }

    res.status(200).json({ success: true, data: item, error: null, meta: null });
  } catch (error) {
    next(error as Error);
  }
});

timeOffRouter.post("/time_off", async (req, res, next) => {
  try {
    const data = timeOffCreateSchema.parse(req.body);

    const user = await req.tenantDb!.user.findFirst({
      where: { id: data.praticien_id, tenant_id: req.tenant!.id }
    });

    if (!user) {
      res.status(404).json({ success: false, data: null, error: { message: "PRACTITIONER_NOT_FOUND" }, meta: null });
      return;
    }

    const item = await createTimeOff(req.tenantDb!, req.tenant!.id, data);

    res.status(201).json({ success: true, data: item, error: null, meta: null });
  } catch (error) {
    next(error as Error);
  }
});

timeOffRouter.patch("/time_off/:id", async (req, res, next) => {
  try {
    const data = timeOffUpdateSchema.parse(req.body);

    if (data.praticien_id) {
      const user = await req.tenantDb!.user.findFirst({
        where: { id: data.praticien_id, tenant_id: req.tenant!.id }
      });

      if (!user) {
        res.status(404).json({ success: false, data: null, error: { message: "PRACTITIONER_NOT_FOUND" }, meta: null });
        return;
      }
    }

    const item = await updateTimeOff(req.tenantDb!, req.tenant!.id, req.params.id, data);

    if (!item) {
      res.status(404).json({ success: false, data: null, error: { message: "NOT_FOUND" }, meta: null });
      return;
    }

    res.status(200).json({ success: true, data: item, error: null, meta: null });
  } catch (error) {
    next(error as Error);
  }
});

timeOffRouter.delete("/time_off/:id", async (req, res, next) => {
  try {
    const deleted = await deleteTimeOff(req.tenantDb!, req.tenant!.id, req.params.id);

    if (!deleted) {
      res.status(404).json({ success: false, data: null, error: { message: "NOT_FOUND" }, meta: null });
      return;
    }

    res.status(204).send();
  } catch (error) {
    next(error as Error);
  }
});
