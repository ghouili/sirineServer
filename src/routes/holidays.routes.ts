import { Router } from "express";

import { auth } from "../middlewares/auth";
import { requireActiveSubscription } from "../middlewares/requireActiveSubscription";
import { requireRole } from "../middlewares/requireRole";
import { tenantResolver } from "../middlewares/tenantResolver";
import { holidayCreateSchema, holidayUpdateSchema } from "../schemas/schedule.schemas";
import { getPaginationParams } from "../utils/pagination";
import {
  createHoliday,
  deleteHoliday,
  getHolidayById,
  listHolidays,
  updateHoliday
} from "../services/holidays.service";

export const holidaysRouter = Router();

holidaysRouter.use(tenantResolver, requireActiveSubscription, auth, requireRole(["admin"]));

holidaysRouter.get("/holidays", async (req, res, next) => {
  try {
    const { limit, offset } = getPaginationParams(
      req.query.limit as string,
      req.query.offset as string
    );

    const { items, total } = await listHolidays(req.tenantDb!, req.tenant!.id, limit, offset);

    res.status(200).json({ success: true, data: items, error: null, meta: { total, limit, offset } });
  } catch (error) {
    next(error as Error);
  }
});

holidaysRouter.get("/holidays/:id", async (req, res, next) => {
  try {
    const item = await getHolidayById(req.tenantDb!, req.tenant!.id, req.params.id);

    if (!item) {
      res.status(404).json({ success: false, data: null, error: { message: "NOT_FOUND" }, meta: null });
      return;
    }

    res.status(200).json({ success: true, data: item, error: null, meta: null });
  } catch (error) {
    next(error as Error);
  }
});

holidaysRouter.post("/holidays", async (req, res, next) => {
  try {
    const data = holidayCreateSchema.parse(req.body);
    const item = await createHoliday(req.tenantDb!, req.tenant!.id, data);

    res.status(201).json({ success: true, data: item, error: null, meta: null });
  } catch (error) {
    next(error as Error);
  }
});

holidaysRouter.patch("/holidays/:id", async (req, res, next) => {
  try {
    const data = holidayUpdateSchema.parse(req.body);
    const item = await updateHoliday(req.tenantDb!, req.tenant!.id, req.params.id, data);

    if (!item) {
      res.status(404).json({ success: false, data: null, error: { message: "NOT_FOUND" }, meta: null });
      return;
    }

    res.status(200).json({ success: true, data: item, error: null, meta: null });
  } catch (error) {
    next(error as Error);
  }
});

holidaysRouter.delete("/holidays/:id", async (req, res, next) => {
  try {
    const deleted = await deleteHoliday(req.tenantDb!, req.tenant!.id, req.params.id);

    if (!deleted) {
      res.status(404).json({ success: false, data: null, error: { message: "NOT_FOUND" }, meta: null });
      return;
    }

    res.status(204).send();
  } catch (error) {
    next(error as Error);
  }
});
