import { Router } from "express";

import { auth } from "../middlewares/auth";
import { requireActiveSubscription } from "../middlewares/requireActiveSubscription";
import { requireRole } from "../middlewares/requireRole";
import { tenantResolver } from "../middlewares/tenantResolver";
import { breakCreateSchema, breakUpdateSchema } from "../schemas/schedule.schemas";
import { getPaginationParams } from "../utils/pagination";
import {
  createBreak,
  deleteBreak,
  getBreakById,
  listBreaks,
  updateBreak
} from "../services/breaks.service";

export const breaksRouter = Router();

breaksRouter.use(tenantResolver, requireActiveSubscription, auth, requireRole(["admin"]));

breaksRouter.get("/breaks", async (req, res, next) => {
  try {
    const { limit, offset } = getPaginationParams(
      req.query.limit as string,
      req.query.offset as string
    );

    const { items, total } = await listBreaks(req.tenantDb!, req.tenant!.id, limit, offset);

    res.status(200).json({ success: true, data: items, error: null, meta: { total, limit, offset } });
  } catch (error) {
    next(error as Error);
  }
});

breaksRouter.get("/breaks/:id", async (req, res, next) => {
  try {
    const item = await getBreakById(req.tenantDb!, req.tenant!.id, req.params.id);

    if (!item) {
      res.status(404).json({ success: false, data: null, error: { message: "NOT_FOUND" }, meta: null });
      return;
    }

    res.status(200).json({ success: true, data: item, error: null, meta: null });
  } catch (error) {
    next(error as Error);
  }
});

breaksRouter.post("/breaks", async (req, res, next) => {
  try {
    const data = breakCreateSchema.parse(req.body);

    const user = await req.tenantDb!.user.findFirst({
      where: { id: data.praticien_id, tenant_id: req.tenant!.id }
    });

    if (!user) {
      res.status(404).json({ success: false, data: null, error: { message: "PRACTITIONER_NOT_FOUND" }, meta: null });
      return;
    }

    const item = await createBreak(req.tenantDb!, req.tenant!.id, data);

    res.status(201).json({ success: true, data: item, error: null, meta: null });
  } catch (error) {
    next(error as Error);
  }
});

breaksRouter.patch("/breaks/:id", async (req, res, next) => {
  try {
    const data = breakUpdateSchema.parse(req.body);

    if (data.praticien_id) {
      const user = await req.tenantDb!.user.findFirst({
        where: { id: data.praticien_id, tenant_id: req.tenant!.id }
      });

      if (!user) {
        res.status(404).json({ success: false, data: null, error: { message: "PRACTITIONER_NOT_FOUND" }, meta: null });
        return;
      }
    }

    const item = await updateBreak(req.tenantDb!, req.tenant!.id, req.params.id, data);

    if (!item) {
      res.status(404).json({ success: false, data: null, error: { message: "NOT_FOUND" }, meta: null });
      return;
    }

    res.status(200).json({ success: true, data: item, error: null, meta: null });
  } catch (error) {
    next(error as Error);
  }
});

breaksRouter.delete("/breaks/:id", async (req, res, next) => {
  try {
    const deleted = await deleteBreak(req.tenantDb!, req.tenant!.id, req.params.id);

    if (!deleted) {
      res.status(404).json({ success: false, data: null, error: { message: "NOT_FOUND" }, meta: null });
      return;
    }

    res.status(204).send();
  } catch (error) {
    next(error as Error);
  }
});
