import { Router } from "express";

import { auth } from "../middlewares/auth";
import { requireActiveSubscription } from "../middlewares/requireActiveSubscription";
import { requireRole } from "../middlewares/requireRole";
import { tenantResolver } from "../middlewares/tenantResolver";
import { availabilityQuerySchema } from "../schemas/availability.schemas";
import { getAvailabilitySlots } from "../services/availability.service";

export const availabilityRouter = Router();

availabilityRouter.use(
  tenantResolver,
  requireActiveSubscription,
  auth,
  requireRole(["admin", "praticien", "assistant"])
);

availabilityRouter.get("/availability/slots", async (req, res, next) => {
  try {
    const query = availabilityQuerySchema.parse(req.query);

    const slots = await getAvailabilitySlots(
      req.tenantDb!,
      req.tenant!.id,
      query.service_id,
      query.praticien_id,
      query.from,
      query.to
    );

    res.status(200).json({
      success: true,
      data: slots.map((slot) => ({
        start: slot.start.toISOString(),
        end: slot.end.toISOString()
      })),
      error: null,
      meta: { count: slots.length }
    });
  } catch (error) {
    next(error as Error);
  }
});
