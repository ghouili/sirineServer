import { Router } from "express";

import { auth } from "../middlewares/auth";
import { requireActiveSubscription } from "../middlewares/requireActiveSubscription";
import { requireRole } from "../middlewares/requireRole";
import { tenantResolver } from "../middlewares/tenantResolver";
import {
  appointmentCreateSchema,
  appointmentUpdateSchema
} from "../schemas/appointments.schemas";
import { getPaginationParams } from "../utils/pagination";
import {
  createAppointment,
  deleteAppointment,
  getAppointmentById,
  listAppointments,
  updateAppointment
} from "../services/appointments.service";
import { notifyWaitlistOnCancellation } from "../services/waitlist.service";

export const appointmentsRouter = Router();

appointmentsRouter.use(tenantResolver, requireActiveSubscription, auth);

appointmentsRouter.get("/appointments", async (req, res, next) => {
  try {
    const { limit, offset } = getPaginationParams(
      req.query.limit as string,
      req.query.offset as string
    );

    const practitionerFilter =
      req.user?.role === "praticien" ? req.user.id : undefined;

    const { items, total } = await listAppointments(
      req.tenantDb!,
      req.tenant!.id,
      limit,
      offset,
      practitionerFilter
    );

    res.status(200).json({ success: true, data: items, error: null, meta: { total, limit, offset } });
  } catch (error) {
    next(error as Error);
  }
});

appointmentsRouter.get("/appointments/:id", async (req, res, next) => {
  try {
    const appointment = await getAppointmentById(
      req.tenantDb!,
      req.tenant!.id,
      req.params.id
    );

    if (!appointment) {
      res.status(404).json({ success: false, data: null, error: { message: "NOT_FOUND" }, meta: null });
      return;
    }

    if (req.user?.role === "praticien" && appointment.praticien_id !== req.user.id) {
      res.status(403).json({ success: false, data: null, error: { message: "FORBIDDEN" }, meta: null });
      return;
    }

    res.status(200).json({ success: true, data: appointment, error: null, meta: null });
  } catch (error) {
    next(error as Error);
  }
});

appointmentsRouter.post(
  "/appointments",
  requireRole(["admin", "assistant", "praticien"]),
  async (req, res, next) => {
    try {
      const data = appointmentCreateSchema.parse(req.body);
      const result = await createAppointment(req.tenantDb!, req.tenant!.id, data);

      if (result.error === "RELATED_NOT_FOUND") {
        res.status(404).json({ success: false, data: null, error: { message: "RELATED_NOT_FOUND" }, meta: null });
        return;
      }

      if (result.error === "OVERLAP") {
        res.status(409).json({ success: false, data: null, error: { message: "APPOINTMENT_OVERLAP" }, meta: null });
        return;
      }

      res.status(201).json({ success: true, data: result.data, error: null, meta: null });
    } catch (error) {
      next(error as Error);
    }
  }
);

appointmentsRouter.patch(
  "/appointments/:id",
  requireRole(["admin", "assistant"]),
  async (req, res, next) => {
    try {
      const data = appointmentUpdateSchema.parse(req.body);
      let appointment = await updateAppointment(
        req.tenantDb!,
        req.tenant!.id,
        req.params.id,
        data
      );

      if (!appointment) {
        res.status(404).json({ success: false, data: null, error: { message: "NOT_FOUND" }, meta: null });
        return;
      }

      if (data.status === "canceled") {
        await notifyWaitlistOnCancellation(req.tenantDb!, req.tenant!.id, appointment.id);
        appointment = await getAppointmentById(
          req.tenantDb!,
          req.tenant!.id,
          appointment.id
        );
      }

      res.status(200).json({ success: true, data: appointment, error: null, meta: null });
    } catch (error) {
      next(error as Error);
    }
  }
);

appointmentsRouter.delete(
  "/appointments/:id",
  requireRole(["admin", "assistant"]),
  async (req, res, next) => {
    try {
      const appointment = await getAppointmentById(
        req.tenantDb!,
        req.tenant!.id,
        req.params.id
      );
      const deleted = await deleteAppointment(req.tenantDb!, req.tenant!.id, req.params.id);

      if (!deleted) {
        res.status(404).json({ success: false, data: null, error: { message: "NOT_FOUND" }, meta: null });
        return;
      }

      if (appointment?.status !== "canceled") {
        await notifyWaitlistOnCancellation(req.tenantDb!, req.tenant!.id, req.params.id);
      }

      res.status(204).send();
    } catch (error) {
      next(error as Error);
    }
  }
);
