import { Router } from "express";

import { auth } from "../middlewares/auth";
import { requireActiveSubscription } from "../middlewares/requireActiveSubscription";
import { requireRole } from "../middlewares/requireRole";
import { tenantResolver } from "../middlewares/tenantResolver";
import {
  serviceRuleCreateSchema,
  serviceRuleUpdateSchema
} from "../schemas/serviceRules.schemas";
import { getPaginationParams } from "../utils/pagination";
import {
  createServiceRule,
  deleteServiceRule,
  getServiceRuleById,
  listServiceRules,
  updateServiceRule
} from "../services/serviceRules.service";

export const serviceRulesRouter = Router();

serviceRulesRouter.use(
  tenantResolver,
  requireActiveSubscription,
  auth,
  requireRole(["admin"])
);

serviceRulesRouter.get("/service_rules", async (req, res, next) => {
  try {
    const { limit, offset } = getPaginationParams(
      req.query.limit as string,
      req.query.offset as string
    );

    const { items, total } = await listServiceRules(req.tenantDb!, req.tenant!.id, limit, offset);

    res.status(200).json({ success: true, data: items, error: null, meta: { total, limit, offset } });
  } catch (error) {
    next(error as Error);
  }
});

serviceRulesRouter.get("/service_rules/:id", async (req, res, next) => {
  try {
    const rule = await getServiceRuleById(req.tenantDb!, req.tenant!.id, req.params.id);

    if (!rule) {
      res.status(404).json({ success: false, data: null, error: { message: "NOT_FOUND" }, meta: null });
      return;
    }

    res.status(200).json({ success: true, data: rule, error: null, meta: null });
  } catch (error) {
    next(error as Error);
  }
});

serviceRulesRouter.post("/service_rules", async (req, res, next) => {
  try {
    const data = serviceRuleCreateSchema.parse(req.body);

    const service = await req.tenantDb!.service.findFirst({
      where: { id: data.service_id, tenant_id: req.tenant!.id }
    });

    if (!service) {
      res.status(404).json({ success: false, data: null, error: { message: "SERVICE_NOT_FOUND" }, meta: null });
      return;
    }

    const rule = await createServiceRule(req.tenantDb!, req.tenant!.id, data);

    res.status(201).json({ success: true, data: rule, error: null, meta: null });
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") {
      res.status(409).json({ success: false, data: null, error: { message: "RULE_EXISTS" }, meta: null });
      return;
    }
    next(error as Error);
  }
});

serviceRulesRouter.patch("/service_rules/:id", async (req, res, next) => {
  try {
    const data = serviceRuleUpdateSchema.parse(req.body);
    const rule = await updateServiceRule(req.tenantDb!, req.tenant!.id, req.params.id, data);

    if (!rule) {
      res.status(404).json({ success: false, data: null, error: { message: "NOT_FOUND" }, meta: null });
      return;
    }

    res.status(200).json({ success: true, data: rule, error: null, meta: null });
  } catch (error) {
    next(error as Error);
  }
});

serviceRulesRouter.delete("/service_rules/:id", async (req, res, next) => {
  try {
    const deleted = await deleteServiceRule(req.tenantDb!, req.tenant!.id, req.params.id);

    if (!deleted) {
      res.status(404).json({ success: false, data: null, error: { message: "NOT_FOUND" }, meta: null });
      return;
    }

    res.status(204).send();
  } catch (error) {
    next(error as Error);
  }
});
