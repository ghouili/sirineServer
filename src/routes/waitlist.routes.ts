import { Router } from "express";

import { auth } from "../middlewares/auth";
import { requireActiveSubscription } from "../middlewares/requireActiveSubscription";
import { requireRole } from "../middlewares/requireRole";
import { tenantResolver } from "../middlewares/tenantResolver";
import { waitlistCreateSchema, waitlistUpdateSchema } from "../schemas/waitlist.schemas";
import { getPaginationParams } from "../utils/pagination";
import {
  createWaitlistEntry,
  listWaitlist,
  updateWaitlistStatus
} from "../services/waitlist.service";

export const waitlistRouter = Router();

waitlistRouter.use(tenantResolver, requireActiveSubscription, auth);

waitlistRouter.get("/waitlist", async (req, res, next) => {
  try {
    const { limit, offset } = getPaginationParams(
      req.query.limit as string,
      req.query.offset as string
    );

    const { items, total } = await listWaitlist(req.tenantDb!, req.tenant!.id, limit, offset);

    res.status(200).json({ success: true, data: items, error: null, meta: { total, limit, offset } });
  } catch (error) {
    next(error as Error);
  }
});

waitlistRouter.post(
  "/waitlist",
  requireRole(["admin", "assistant"]),
  async (req, res, next) => {
    try {
      const data = waitlistCreateSchema.parse(req.body);
      const entry = await createWaitlistEntry(req.tenantDb!, req.tenant!.id, data);

      res.status(201).json({ success: true, data: entry, error: null, meta: null });
    } catch (error) {
      next(error as Error);
    }
  }
);

waitlistRouter.patch(
  "/waitlist/:id",
  requireRole(["admin", "assistant"]),
  async (req, res, next) => {
    try {
      const data = waitlistUpdateSchema.parse(req.body);

      if (!data.status) {
        res.status(400).json({ success: false, data: null, error: { message: "STATUS_REQUIRED" }, meta: null });
        return;
      }

      const entry = await updateWaitlistStatus(
        req.tenantDb!,
        req.tenant!.id,
        req.params.id,
        data.status
      );

      if (!entry) {
        res.status(404).json({ success: false, data: null, error: { message: "NOT_FOUND" }, meta: null });
        return;
      }

      res.status(200).json({ success: true, data: entry, error: null, meta: null });
    } catch (error) {
      next(error as Error);
    }
  }
);
